import { Directive } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BaseResourceFormComponent } from './base-resource-form.component';

@Directive()
export abstract class BaseResourceFormGroupComponent<
  R = Record<string, unknown>,
  F = R,
> extends BaseResourceFormComponent<R, F, FormGroup> {
  override getResourceMergeStrategy() {
    return true;
  }
}
