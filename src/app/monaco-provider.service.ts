/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />
/// <reference path="../../node_modules/monaco-yaml/monaco.d.ts" />

import { Injectable } from '@angular/core';
import { MonacoProviderService } from 'ng-monaco-editor';

const k8sDeploymentSchema =
  'https://raw.githubusercontent.com/garethr/kubernetes-json-schema/master/master/deployment.json';

/**
 * Custom monaco provider to do some customizations.
 */
@Injectable({
  providedIn: 'root',
})
export class CustomMonacoProviderService extends MonacoProviderService {
  async initMonaco() {
    await super.initMonaco();

    // Load custom yaml language service:
    await super.loadModule([
      // YAML language services are currently managed manually in thirdparty_lib
      'vs/basic-languages/monaco.contribution',
      'vs/language/yaml/monaco.contribution',
    ]);
    this.configYaml();
  }

  private configYaml() {
    monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: true,
      schemas: [
        {
          uri: k8sDeploymentSchema,
          fileMatch: ['*'],
        },
      ],
    });
  }
}
