/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MonacoEditorModule, MonacoProviderService } from 'ng-monaco-editor';

import { ButtonDirective } from './button.directive';
import { DemoComponent } from './component';
import { ContainerFormComponent } from './container/component';
import { DeploymentFormComponent } from './deployment/component';
import { FormSectionComponent } from './form-section/component';
import { KeyValueFormComponent } from './key-value-form/component';
import { CustomMonacoProviderService } from './monaco-provider.service';
import { PodSpecFormComponent } from './pod-spec/component';
import { DemoRoutingModule } from './routing.module';

const DEFAULT_MONACO_OPTIONS: monaco.editor.IEditorConstructionOptions = {
  fontSize: 12,
  folding: true,
  scrollBeyondLastLine: true,
  minimap: { enabled: false },
  mouseWheelZoom: false,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
  },
  fixedOverflowWidgets: true,
};

@NgModule({
  declarations: [
    DemoComponent,
    DeploymentFormComponent,
    PodSpecFormComponent,
    FormSectionComponent,
    ContainerFormComponent,
    KeyValueFormComponent,
    ButtonDirective,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MonacoEditorModule.forRoot({
      // Angular CLI currently does not handle assets with hashes. We manage it by manually adding
      // version numbers to force library updates:
      baseUrl: 'lib/v1.2',
      defaultOptions: DEFAULT_MONACO_OPTIONS,
    }),
    DemoRoutingModule,
  ],
  providers: [
    {
      provide: MonacoProviderService,
      useClass: CustomMonacoProviderService,
    },
  ],
})
export class DemoModule {}
