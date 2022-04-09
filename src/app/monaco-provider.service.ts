/// <reference path="../../node_modules/monaco-yaml/index.d.ts" />

import { Injectable } from '@angular/core';
import { Monaco, MonacoProviderService } from 'ng-monaco-editor';

/**
 * Custom monaco provider to do some customizations.
 */
@Injectable({
  providedIn: 'root',
})
export class CustomMonacoProviderService extends MonacoProviderService {
  private ready?: Promise<Monaco>;

  override async initMonaco() {
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
    this.monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
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
