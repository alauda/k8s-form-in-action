import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { safeDump, safeLoadAll } from 'js-yaml';
import * as Md from 'markdown-it';
import { MonacoProviderService } from 'ng-monaco-editor';
import { combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { PathProviderService } from './path.service';

function defer(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
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
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private http: HttpClient,
    private monacoProvider: MonacoProviderService,
    private pathProvider: PathProviderService,
  ) {
    this.monacoReady = new Promise(
      (resolve) => (this.monacoReadyResolve = resolve),
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
        map((value) => this.formToYaml(value)),
        filter((v) => !!v),
      )
      .subscribe((value) => {
        yamlCtrl.setValue(value, { emitEvent: false });
      });

    yamlCtrl.valueChanges
      .pipe(
        startWith(yamlCtrl.value),
        map((value) => this.yamlToForm(value)),
        filter((v) => !!v),
      )
      .subscribe((value) => {
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

    editor.onDidChangeCursorSelection(async ({ selection }) => {
      const model = editor.getModel();
      const position = selection.getPosition();
      const symbols = await _getSymbolsForPosition(model, position);
      this.pathProvider.subject.next(symbols.map((symbol) => symbol.name));
    });

    async function _getSymbolsForPosition(
      model: monaco.editor.IModel,
      position: monaco.IPosition,
    ) {
      let symbols = await getDocumentSymbols(model, true, NEVER_CANCEL_TOKEN);

      return (symbols = symbols.filter((symbol) =>
        symbol.range.containsPosition(position),
      ));
    }
  }

  async highlightSymbol(path: string[]) {
    const [editor, _, getHover] = await this.monacoReady;

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

        const [{ contents }] = await getHover(
          editor.getModel(),
          position,
          NEVER_CANCEL_TOKEN,
        );

        this.contents = md.render(
          contents.map((content) => content.value).join('\n'),
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
    const [editor, quickOpen] = await this.monacoReady;
    const model = editor.getModel();
    const symbols: monaco.languages.DocumentSymbol[] = await quickOpen.getDocumentSymbols(
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
        // tslint:disable-next-line:triple-equals
        (_symbol) => _symbol.name == path[pathDepth],
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
      } else {
        return childSymbol || parent;
      }
    }

    const symbol = _findSymbolForPath(undefined, symbols, 0);

    return symbol && symbol.range;
  }

  private yamlToForm(yaml: string) {
    try {
      const formModels = safeLoadAll(yaml).map((item) =>
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
    } catch (err) {}
  }

  private formToYaml(json: any) {
    console.log('formToYaml');
    try {
      // Following line is to remove undefined values
      json = JSON.parse(JSON.stringify(json));
      return safeDump(json);
    } catch (err) {
      console.log(err);
    }
  }
}
