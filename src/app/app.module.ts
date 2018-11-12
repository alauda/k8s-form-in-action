/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { MonacoEditorModule, MonacoProviderService } from 'ng-monaco-editor';

import { AppComponent } from './app.component';
import { CustomMonacoProviderService } from './monaco-provider.service';

const DEFAULT_MONACO_OPTIONS: monaco.editor.IEditorConstructionOptions = {
  fontSize: 12,
  folding: true,
  scrollBeyondLastLine: true,
  minimap: { enabled: false },
  mouseWheelZoom: true,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
  },
  fixedOverflowWidgets: true,
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    MonacoEditorModule.forRoot({
      // Angular CLI currently does not handle assets with hashes. We manage it by manually adding
      // version numbers to force library updates:
      baseUrl: 'lib/v1.1',
      defaultOptions: DEFAULT_MONACO_OPTIONS,
    }),
    RouterModule.forRoot([
      {
        path: '',
        loadChildren: './demo/module#DemoModule',
      },
    ]),
  ],
  providers: [
    {
      provide: MonacoProviderService,
      useClass: CustomMonacoProviderService,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
