import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ng-monaco-editor';

import { ButtonDirective } from './button.directive';
import { DemoComponent } from './component';
import { ContainerFormComponent } from './container/component';
import { DeploymentFormComponent } from './deployment/component';
import { FormSectionComponent } from './form-section/component';
import { KeyValueFormComponent } from './key-value-form/component';
import { PodSpecFormComponent } from './pod-spec/component';
import { VFormComponent } from './valid/component';
import { VSpecFormComponent } from './valid/spec/component';
import { VSpecStepFormComponent } from './valid/spec/step/component';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MonacoEditorModule],
  declarations: [
    DemoComponent,
    DeploymentFormComponent,
    PodSpecFormComponent,
    FormSectionComponent,
    ContainerFormComponent,
    KeyValueFormComponent,
    ButtonDirective,
    VFormComponent,
    VSpecFormComponent,
    VSpecStepFormComponent,
  ],
  exports: [DemoComponent],
})
export class DemoModule {}
