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
import { MonacoProviderService } from 'ng-monaco-editor';
import { combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { PathProviderService } from './path.service';

function defer(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

const md = new Md();

const NEVER_CANCEL_TOKEN = {
  isCancellationRequested: false,
  onCancellationRequested: () => Event.NONE,
};

@Component({
  selector: 'x-demo',
  templateUrl: './template.html',
  styleUrls: ['./style.css'],
  providers: [PathProviderService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoComponent implements OnInit {
  form: FormGroup;
  monacoReady: Promise<[monaco.editor.IStandaloneCodeEditor, any, any]>;
  contents: string;
  private monacoReadyResolve: ([editor, getDocumentSymbols, getHover]: [
    monaco.editor.IStandaloneCodeEditor,
    any,
    any,
  ]) => void;

  private oldDecorations: string[] = [];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly monacoProvider: MonacoProviderService,
    private readonly pathProvider: PathProviderService,
  ) {
    this.monacoReady = new Promise(
      resolve => (this.monacoReadyResolve = resolve),
    );
  }

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
      .subscribe((deployment: string) => {
        yamlCtrl.setValue(deployment);
      });

    combineLatest([
      this.pathProvider.subject,
      uiCtrl.valueChanges.pipe(startWith(uiCtrl.value)),
    ])
      .pipe(filter(([path]) => !!path && path.length > 0))
      .subscribe(([path]) => {
        this.highlightSymbol(path);
      });
  }

  async editorChanged(editor: monaco.editor.IStandaloneCodeEditor) {
    console.log('editor changed');

    const [{ getDocumentSymbols }, { getHover }]: any = await Promise.all([
      this.monacoProvider.loadModule([
        'vs/editor/contrib/documentSymbols/documentSymbols',
      ]),
      this.monacoProvider.loadModule(['vs/editor/contrib/hover/getHover']),
    ]);

    await this.monacoProvider.initMonaco();

    // Make sure the yaml language service is online:
    await defer(100);

    this.monacoReadyResolve([editor, getDocumentSymbols, getHover]);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    editor.onDidChangeCursorSelection(async ({ selection }) => {
      const model = editor.getModel();
      const position = selection.getPosition();
      const symbols = await _getSymbolsForPosition(model, position);
      this.pathProvider.subject.next(symbols.map(symbol => symbol.name));
    });

    async function _getSymbolsForPosition(
      model: monaco.editor.IModel,
      position: monaco.IPosition,
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const symbols: any[] = await getDocumentSymbols(
        model,
        true,
        NEVER_CANCEL_TOKEN,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return symbols.filter(symbol => symbol.range.containsPosition(position));
    }
  }

  async highlightSymbol(path: string[]) {
    const [editor, , getHover] = await this.monacoReady;

    let decoration: any;
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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const [{ contents }] = await getHover(
          editor.getModel(),
          position,
          NEVER_CANCEL_TOKEN,
        );

        this.contents = md.render(
          (contents as Array<{ value: string }>)
            .map(content => content.value)
            .join('\n'),
        );
      }
    }

    this.oldDecorations = editor.deltaDecorations(
      this.oldDecorations,
      decoration ? [decoration] : [],
    );

    this.cdr.markForCheck();
  }

  private async getYamlRangeForPath(path: string[]): Promise<monaco.IRange> {
    const [editor, getDocumentSymbols] = await this.monacoReady;
    const model = editor.getModel();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const symbols: monaco.languages.DocumentSymbol[] = await getDocumentSymbols(
      model,
      false,
      NEVER_CANCEL_TOKEN,
    );
    function _findSymbolForPath(
      parent: monaco.languages.DocumentSymbol,
      _symbols: monaco.languages.DocumentSymbol[],
      pathDepth: number,
    ): monaco.languages.DocumentSymbol {
      const childSymbol = _symbols.find(
        // eslint-disable-next-line eqeqeq
        _symbol => _symbol.name == path[pathDepth],
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

    return symbol && symbol.range;
  }

  private yamlToForm(yaml: string) {
    try {
      const formModels = loadAll(yaml).map(item =>
        item === 'undefined' ? undefined : item,
      );
      let formModel = formModels[0];

      // For now we can only process a single deployment resource in the yaml.
      if (formModels.length > 1) {
        console.log('Can only convert a single resource at the moment');
      }

      if (!formModel || formModel instanceof String) {
        formModel = {};
      }
      return formModel;
    } catch {}
  }

  private formToYaml(json: any) {
    console.log('formToYaml');
    try {
      // Following line is to remove undefined values
      json = JSON.parse(JSON.stringify(json));
      return dump(json);
    } catch (err) {
      console.log(err);
    }
  }
}
