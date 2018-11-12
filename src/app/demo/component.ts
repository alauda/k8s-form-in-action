import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { safeDump, safeLoadAll } from 'js-yaml';
import { MonacoProviderService } from 'ng-monaco-editor';
import { combineLatest } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

import { PathProviderService } from './path.service';

function defer(timeout: number) {
  return new Promise(res => setTimeout(res, timeout));
}

@Component({
  selector: 'x-demo',
  templateUrl: './template.html',
  styleUrls: ['./style.css'],
  providers: [PathProviderService],
})
export class DemoComponent implements OnInit {
  form: FormGroup;
  monacoReady: Promise<[monaco.editor.IStandaloneCodeEditor, any]>;
  private monacoReadyRes: Function;

  private oldDecorations: string[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private monacoProvider: MonacoProviderService,
    private pathProvider: PathProviderService,
  ) {
    this.monacoReady = new Promise(res => (this.monacoReadyRes = res));
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

    combineLatest(
      this.pathProvider.subject,
      uiCtrl.valueChanges.pipe(startWith(uiCtrl.value)),
    )
      .pipe(filter(([path]) => !!path && path.length > 0))
      .subscribe(([path]) => {
        this.highlightSymbol(path);
      });
  }

  async editorChanged(editor: monaco.editor.IStandaloneCodeEditor) {
    const quickOpen: any = await this.monacoProvider.loadModule([
      'vs/editor/contrib/quickOpen/quickOpen',
    ]);

    await this.monacoProvider.initMonaco();

    // Make sure the yaml language service is online:
    await defer(500);
    this.monacoReadyRes([editor, quickOpen]);

    editor.onDidChangeCursorSelection(async ({ selection }) => {
      const model = editor.getModel();
      const position = selection.getPosition();
      const symbols = await _getSymbolsForPosition(model, position);
      console.log(symbols);
      if (editor.hasTextFocus()) {
        this.highlightSymbol([]);
      }
    });

    async function _getSymbolsForPosition(
      model: monaco.editor.IModel,
      position: monaco.IPosition,
    ) {
      let symbols = await quickOpen.getDocumentSymbols(model);
      symbols = symbols.filter(symbol =>
        symbol.range.containsPosition(position),
      );
      symbols = symbols.map(symbol => {
        if (symbol.kind === 17) {
          return `[]${symbol.name}`;
        } else if (symbol.kind === 18 || symbol.kind === 1) {
          return `{}${symbol.name}`;
        } else {
          return symbol.name;
        }
      });
      return symbols;
    }
  }

  async highlightSymbol(path: string[]) {
    const [editor] = await this.monacoReady;
    const range = await this.getYamlRangeForPath(path);

    let decoration: any;
    if (range) {
      editor.revealPositionInCenter(
        {
          column: range.startColumn,
          lineNumber: range.startLineNumber,
        },
        monaco.editor.ScrollType.Smooth,
      );

      decoration = {
        range,
        options: {
          isWholeLine: true,
          className: 'x-highlight-range',
        },
      };
    }

    this.oldDecorations = editor.deltaDecorations(
      this.oldDecorations,
      decoration ? [decoration] : [],
    );
  }

  private async getYamlRangeForPath(path: string[]): Promise<monaco.IRange> {
    const [editor, quickOpen] = await this.monacoReady;
    const symbols = await quickOpen.getDocumentSymbols(editor.getModel());
    const arrayIndeces = path.filter(p => Number.isInteger(+p));
    const flattenedPath = path
      .filter(p => p && !Number.isInteger(+p))
      .join('.');

    function getSymbolPath(symbol: any) {
      return (
        (symbol.containerName ? symbol.containerName + '.' : '') + symbol.name
      );
    }

    const candidates = symbols.filter(symbol => {
      return getSymbolPath(symbol) === flattenedPath;
    });

    let res: any;

    // TODO: we can only parse a single nested array for the moment:
    if (candidates.length > 1 && arrayIndeces.length === 1) {
      res = candidates[arrayIndeces[0]];
    } else {
      res = candidates[0];
    }

    return res && res.range;
  }

  private yamlToForm(yaml: string) {
    try {
      const formModels = safeLoadAll(yaml).map(item =>
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
    try {
      // Following line is to remove undefined values
      json = JSON.parse(JSON.stringify(json));
      return safeDump(json);
    } catch (err) {
      console.log(err);
    }
  }
}
