import { Directive } from '@angular/core';
import { FormArray } from '@angular/forms';

import { BaseResourceFormComponent } from './base-resource-form.component';

@Directive()
// tslint:disable-next-line: directive-class-suffix
export abstract class BaseResourceFormArrayComponent<
  // eslint-disable-next-line @typescript-eslint/ban-types
  R extends object = { [key: string]: unknown },
  // eslint-disable-next-line @typescript-eslint/ban-types
  F extends object = R
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
