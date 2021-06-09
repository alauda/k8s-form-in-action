import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { dump, loadAll } from 'js-yaml';
import Md from 'markdown-it';
import type {
  CancellationToken,
  IPosition,
  IRange,
  Position,
  Range,
  editor,
  languages,
} from 'monaco-editor';
import {
  Monaco,
  MonacoEditor,
  MonacoEditorOptions,
  MonacoProviderService,
} from 'ng-monaco-editor';
import { combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { PathProviderService } from './path.service';

const md = new Md();

const NEVER_CANCEL_TOKEN: CancellationToken = {
  isCancellationRequested: false,
  onCancellationRequested: () => ({
    dispose() {
      //
    },
  }),
};

export type MonacoReadyResult = [
  Monaco,
  MonacoEditor,
  typeof import('monaco-editor/esm/vs/editor/contrib/documentSymbols/documentSymbols').getDocumentSymbols,
  typeof import('monaco-editor/esm/vs/editor/contrib/hover/getHover').getHover,
];

const EDITOR_OPTIONS: MonacoEditorOptions = {
  language: 'yaml',
  folding: true,
  minimap: { enabled: false },
  wordWrap: 'on',
  tabSize: 2,
  lineNumbers: 'on',
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
};

/**
 * fix https://github.com/microsoft/monaco-editor/issues/2517 temporarily.
 * Ideally, we should use the `flat` parameter of `getDocumentSymbols` instead.
 */
const flatSymbols = (symbols: languages.DocumentSymbol[]) => {
  const flattenSymbols: languages.DocumentSymbol[] = [];
  for (const symbol of symbols) {
    flattenSymbols.push(symbol);
    if (symbol.children?.length) {
      flattenSymbols.push(...flatSymbols(symbol.children));
    }
  }
  return flattenSymbols;
};

@Component({
  selector: 'x-demo',
  templateUrl: 'template.html',
  styleUrls: ['styles.scss'],
  providers: [PathProviderService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoComponent implements OnInit {
  form: FormGroup;

  contents: string;

  EDITOR_OPTIONS = EDITOR_OPTIONS;

  private monacoReadyResolve: (result: MonacoReadyResult) => void;

  private oldDecorations: string[] = [];

  private readonly monacoReady = new Promise<MonacoReadyResult>(
    resolve => (this.monacoReadyResolve = resolve),
  );

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly monacoProvider: MonacoProviderService,
    private readonly pathProvider: PathProviderService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      ui: [],
      yaml: [],
    });

    const uiCtrl = this.form.get('ui');
    const yamlCtrl = this.form.get('yaml');

    uiCtrl.valueChanges
      .pipe(
        startWith(uiCtrl.value),
        map(value => this.formToYaml(value)),
        filter(v => !!v),
      )
      .subscribe(value => {
        yamlCtrl.setValue(value, { emitEvent: false });
      });

    yamlCtrl.valueChanges
      .pipe(
        startWith(yamlCtrl.value),
        map(value => this.yamlToForm(value)),
        filter(v => !!v),
      )
      .subscribe(value => {
        uiCtrl.setValue(value, { emitEvent: false });
      });

    this.http
      .get('assets/deployment.yaml', {
        responseType: 'text',
      })
      .subscribe(deployment => {
        yamlCtrl.setValue(deployment);
      });

    combineLatest([
      this.pathProvider.subject,
      uiCtrl.valueChanges.pipe(startWith(uiCtrl.value)),
    ])
      .pipe(filter(([path]) => path?.length > 0))
      .subscribe(([path]) => {
        this.highlightSymbol(path);
      });
  }

  async onEditorChange(editor: MonacoEditor) {
    const [{ getDocumentSymbols }, { getHover }] = await Promise.all([
      import(
        'monaco-editor/esm/vs/editor/contrib/documentSymbols/documentSymbols'
      ),
      import('monaco-editor/esm/vs/editor/contrib/hover/getHover'),
    ]);

    this.monacoReadyResolve([
      this.monacoProvider.monaco,
      editor,
      getDocumentSymbols,
      getHover,
    ]);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    editor.onDidChangeCursorSelection(async ({ selection }) => {
      const model = editor.getModel();
      const position = selection.getPosition();
      const symbols = await _getSymbolsForPosition(model, position);
      this.pathProvider.subject.next(symbols.map(symbol => symbol.name));
    });

    async function _getSymbolsForPosition(
      model: editor.IModel,
      position: IPosition,
    ) {
      const symbols = await getDocumentSymbols(
        model,
        false,
        NEVER_CANCEL_TOKEN,
      );
      return flatSymbols(symbols).filter(symbol =>
        (symbol.range as Range).containsPosition(position),
      );
    }
  }

  async highlightSymbol(path: string[]) {
    const [monaco, editor, , getHover] = await this.monacoReady;

    let decoration: editor.IModelDeltaDecoration;

    if (!editor.hasTextFocus()) {
      const range = await this.getYamlRangeForPath(path);

      if (range) {
        const position = {
          column: range.startColumn,
          lineNumber: range.startLineNumber,
        };

        editor.revealPositionInCenter(
          position,
          monaco.editor.ScrollType.Smooth,
        );

        decoration = {
          range,
          options: {
            isWholeLine: true,
            className: 'x-highlight-range',
          },
        };

        const [{ contents }] = await getHover(
          editor.getModel(),
          position as Position,
          NEVER_CANCEL_TOKEN,
        );

        this.contents = md.render(
          contents.map(content => content.value).join('\n'),
        );
      }
    }

    this.oldDecorations = editor.deltaDecorations(
      this.oldDecorations,
      decoration ? [decoration] : [],
    );

    this.cdr.markForCheck();
  }

  private async getYamlRangeForPath(path: string[]): Promise<IRange> {
    const [, editor, getDocumentSymbols] = await this.monacoReady;
    const model = editor.getModel();
    const symbols = await getDocumentSymbols(model, false, NEVER_CANCEL_TOKEN);
    function _findSymbolForPath(
      parent: languages.DocumentSymbol,
      docSymbols: languages.DocumentSymbol[],
      pathDepth: number,
    ): languages.DocumentSymbol {
      const childSymbol = docSymbols.find(
        symbol => symbol.name === path[pathDepth],
      );

      if (
        path.length - 1 !== pathDepth &&
        childSymbol &&
        Array.isArray(childSymbol.children)
      ) {
        return _findSymbolForPath(
          childSymbol,
          childSymbol.children,
          pathDepth + 1,
        );
      }
      return childSymbol || parent;
    }

    const symbol = _findSymbolForPath(undefined, symbols, 0);

    return symbol?.range;
  }

  private yamlToForm(yaml: string) {
    try {
      const formModels = loadAll(yaml).map(item =>
        item === 'undefined' ? undefined : item,
      );

      let formModel = formModels[0];

      // For now we can only process a single deployment resource in the yaml.
      if (formModels.length > 1) {
        console.warn('Can only convert a single resource at the moment');
        console.warn('formModels:', formModels);
      }

      if (!formModel || formModel instanceof String) {
        formModel = {};
      }
      return formModel;
    } catch (err) {
      console.error(err);
    }
  }

  private formToYaml(json: unknown) {
    try {
      return dump(json, { skipInvalid: true });
    } catch (err) {
      console.error(err);
    }
  }
}
