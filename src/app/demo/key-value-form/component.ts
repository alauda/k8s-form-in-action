import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormArray, ValidatorFn } from '@angular/forms';

import { StringMap } from '../types';

import { BaseResourceFormComponent } from 'ng-resource-form-util';

export type KeyValue = [string, string];

// 用以Form级别的键值映射对象的修改.
// 这个表单有些特别. 内部实现是以FormArray实现, 但对外暴露的是一个key->value对象.
@Component({
  selector: 'x-key-value-form',
  templateUrl: 'template.html',
  styleUrls: ['styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyValueFormComponent extends BaseResourceFormComponent<
  StringMap,
  KeyValue[],
  FormArray
> {
  getResourceMergeStrategy() {
    return false;
  }

  createForm() {
    const duplicateKeyValidator = (fArray: AbstractControl) => {
      const names: string[] = [];
      for (const control of (fArray as FormArray).controls) {
        const [name] = control.value as string[];
        if (!names.includes(name)) {
          names.push(name);
        } else {
          return { duplicatedContainerName: true };
        }
      }
      return null;
    };

    return this.fb.array([], duplicateKeyValidator);
  }

  getDefaultFormModel(): KeyValue[] {
    return [['', '']];
  }

  override adaptResourceModel(resource: { [key: string]: string }) {
    let newFormModel = Object.entries(resource || {});
    if (newFormModel.length === 0) {
      newFormModel = this.getDefaultFormModel();
    }

    return newFormModel;
  }

  override adaptFormModel(formModel: KeyValue[]) {
    return formModel
      .filter(row => !!row[0])
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
  }

  override getOnFormArrayResizeFn() {
    return () => this.createNewControl();
  }

  add(index = this.form.length) {
    this.form.insert(index, this.getOnFormArrayResizeFn()());
    this.cdr.markForCheck();
  }

  remove(index: number) {
    this.form.removeAt(index);
    this.cdr.markForCheck();
  }

  protected createNewControl() {
    const missingKeyValidator: ValidatorFn = control => {
      const [key, value] = control.value;
      if (value && !key) {
        return { keyIsMissing: true };
      }
      return null;
    };

    return this.fb.array([[], []], [missingKeyValidator]);
  }
}
