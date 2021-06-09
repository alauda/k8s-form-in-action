import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { MonacoEditorModule, MonacoProviderService } from 'ng-monaco-editor';

import { AppComponent } from './app.component';
import { DemoModule } from './demo/module';
import { CustomMonacoProviderService } from './monaco-provider.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    DemoModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MonacoEditorModule.forRoot({
      dynamicImport: () => import('monaco-editor'),
    }),
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
