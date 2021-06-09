/// <reference path="../../node_modules/monaco-yaml/lib/monaco.d.ts" />

import { Injectable } from '@angular/core';
import { Monaco, MonacoProviderService } from 'ng-monaco-editor';

/**
 * Custom monaco provider to do some customizations.
 */
@Injectable({
  providedIn: 'root',
})
export class CustomMonacoProviderService extends MonacoProviderService {
  private ready: Promise<Monaco>;

  async initMonaco() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (!this.ready) {
      this.ready = new Promise((resolve, reject) => {
        super
          .initMonaco()
          .then(monaco => {
            this.configYaml();
            resolve(monaco);
          })
          .catch(reject);
      });
    }
    return this.ready;
  }

  private configYaml() {
    monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
      validate: true,
      format: true,
      enableSchemaRequest: true,
      schemas: [
        {
          uri: 'schema/all.json',
          fileMatch: ['*'],
        },
      ],
    });
  }
}
