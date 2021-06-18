import { Directive } from '@angular/core';
import { FormArray } from '@angular/forms';

import { BaseResourceFormComponent } from './base-resource-form.component';

@Directive()
export abstract class BaseResourceFormArrayComponent<
  R = Record<string, unknown>,
  F = R,
> extends BaseResourceFormComponent<R[], F[], FormArray> {
  get length() {
    return this.form.length;
  }

  /**
   * Method to create the default form
   */
  createForm() {
    return new FormArray([]);
  }

  getDefaultFormModel(): F[] {
    return [];
  }

  getResourceMergeStrategy() {
    return false;
  }

  add(index = this.length) {
    this.form.insert(index, this.getOnFormArrayResizeFn()([index]));
    this.cdr.markForCheck();
  }

  remove(index: number) {
    this.form.removeAt(index);
    this.cdr.markForCheck();
  }
}
