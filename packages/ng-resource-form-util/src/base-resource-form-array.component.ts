import { Directive } from '@angular/core';
import { AbstractControl, FormArray, FormControl } from '@angular/forms';

import { BaseResourceFormComponent } from './base-resource-form.component';

@Directive()
export abstract class BaseResourceFormArrayComponent<
  R = Record<string, unknown>,
  F = R,
  Control extends AbstractControl<F> = FormControl<F>,
> extends BaseResourceFormComponent<R[], F[], FormArray<Control>> {
  get length() {
    return this.form.length;
  }

  /**
   * Method to create the default form
   */
  createForm() {
    return new FormArray<Control>([]);
  }

  override getDefaultFormModel(): F[] {
    return [];
  }

  add(index = this.length) {
    this.form.insert(index, this.getOnFormArrayResizeFn()([index]) as Control);
    this.cdr.markForCheck();
  }

  remove(index: number) {
    this.form.removeAt(index);
    this.cdr.markForCheck();
  }
}
