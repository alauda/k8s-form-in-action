import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ng-monaco-editor';

import { DemoComponent } from './component';
import { ContainerFormComponent } from './container/component';
import { DeploymentFormComponent } from './deployment/component';
import { FormSectionComponent } from './form-section/component';
import { KeyValueFormComponent } from './key-value-form/component';
import { PodSpecFormComponent } from './pod-spec/component';
import { DemoRoutingModule } from './routing.module';

@NgModule({
  declarations: [
    DemoComponent,
    DeploymentFormComponent,
    PodSpecFormComponent,
    FormSectionComponent,
    ContainerFormComponent,
    KeyValueFormComponent,
  ],
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
