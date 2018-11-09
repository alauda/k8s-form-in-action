import { Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BaseResourceFormComponent } from './base-resource-form.component';

export abstract class BaseResourceFormGroupComponent<
  T = { [key: string]: any }
> extends BaseResourceFormComponent<T> {
  form: FormGroup;

  /**
   * Method to create the default form
   */
  abstract createForm(): FormGroup;

  getResourceMergeStrategy() {
    return true;
  }

  constructor(injector: Injector) {
    super(injector);
  }
}
