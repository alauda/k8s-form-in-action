import { Directive } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BaseResourceFormComponent } from './base-resource-form.component';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class BaseResourceFormGroupComponent<
  // eslint-disable-next-line @typescript-eslint/ban-types
  R extends object = { [key: string]: unknown },
  // eslint-disable-next-line @typescript-eslint/ban-types
  F extends object = R
> extends BaseResourceFormComponent<R, F, FormGroup> {
  getResourceMergeStrategy() {
    return true;
  }
}
