import { Directive } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BaseResourceFormComponent } from './base-resource-form.component';

@Directive()
export abstract class BaseResourceFormGroupComponent<
  R extends Object = { [key: string]: any },
  F extends Object = R
> extends BaseResourceFormComponent<R, F, FormGroup> {
  getResourceMergeStrategy() {
    return true;
  }
}
