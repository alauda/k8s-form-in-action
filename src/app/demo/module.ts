import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ng-monaco-editor';

import { DemoComponent } from './component';
import { DeploymentFormComponent } from './deployment/component';
import { DemoRoutingModule } from './routing.module';

@NgModule({
  declarations: [DemoComponent, DeploymentFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MonacoEditorModule,
    DemoRoutingModule,
  ],
})
export class DemoModule {}
