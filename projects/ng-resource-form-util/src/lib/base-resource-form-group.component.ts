import { Injector } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BaseResourceFormComponent } from './base-resource-form.component';

export abstract class BaseResourceFormGroupComponent<
  R extends Object = { [key: string]: any },
  F extends Object = R
> extends BaseResourceFormComponent<R, F> {
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
