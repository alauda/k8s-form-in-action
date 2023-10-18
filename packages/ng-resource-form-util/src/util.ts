import {
  AbstractControl,
  FormArray,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';
import { cloneDeep, get, has, isEqual, set, unset } from 'lodash-es';

export type OnFormArrayResizeFn = (path: PathParam) => AbstractControl;
export type PathParam = Array<string | number>;

/**
 * Utility function to set a dynamic form with the given resource.
 * It assume the given form will have the same or subset of the resource.
 *
 * This function will mutate the form.
 *
 * Note: If a given path at the FormControl is type of FormArray and has inconsistent
 * length of the model at the same path, it will be resized with the provided factory function.
 *
 * Since the given 'resource' may not has the same schema with the form
 * (not all fields are editable in biz logic), we will traverse the form hierarchy
 * and feed each form control with the value at the path.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function setFormByResource<R>(
  form: AbstractControl,
  resource: R,
  onFormArrayResize: OnFormArrayResizeFn,
): void {
  let newFormValue = cloneDeep(form.value);

  const setFormValueByPath = (
    item: AbstractControl,
    pathToOrigin: PathParam = [],
  ) => {
    const emptyPath = pathToOrigin.length === 0;

    const newValueAtPath = emptyPath ? resource : get(resource, pathToOrigin);

    if (item instanceof FormGroup) {
      Object.entries(item.controls).forEach(
        ([key, control]: [string, AbstractControl]) => {
          setFormValueByPath(control, [...pathToOrigin, key]);
        },
      );
    } else if (item instanceof FormArray) {
      const newLength = Array.isArray(newValueAtPath)
        ? newValueAtPath.length
        : 0;
      // This makes sure FormArray has the same length with the input
      while (item.length !== newLength) {
        if (item.length < newLength) {
          item.push(onFormArrayResize(pathToOrigin));
        } else {
          item.removeAt(item.length - 1);
        }
      }
      item.controls.forEach((control, index) => {
        setFormValueByPath(control, [...pathToOrigin, index]);
      });
    } else if (emptyPath) {
      newFormValue = resource;
    } else if (has(resource, pathToOrigin)) {
      set(newFormValue, pathToOrigin, newValueAtPath);
    }
  };

  setFormValueByPath(form);

  if (!isEqual(form.value, newFormValue)) {
    // We use patchValue here since not all values in resource has associated
    // form controls
    form.patchValue(newFormValue);
  }
}

/**
 * Utility function to set a resource model with the given form.
 * It assume the given form will have the same or subset of the resource model.
 *
 * Note: If a given path at the FormControl is type of FormArray and has inconsistent
 * length of the model at the same path, the model will be resized with the same size.
 *
 * Since the given 'resource' may not has the same schema with the form
 * (not all fields are editable in biz logic), we will traverse the control and feed
 * each field one by one.
 */

export function setResourceByForm<R extends object>(
  form: AbstractControl,
  resource: R,
): R {
  const newResource = cloneDeep<R>(resource);
  const formValue = form.value;

  const setResourceValueByPath = (
    item: AbstractControl = form,
    path: PathParam = [],
  ) => {
    const emptyPath = path.length === 0;

    let newValueAtPath = emptyPath ? formValue : get(formValue, path);
    const resourceAtPath = emptyPath ? newResource : get(newResource, path);

    if (typeof newValueAtPath === 'string') {
      newValueAtPath = newValueAtPath.trim();
    }

    if (item instanceof FormGroup) {
      Object.entries(item.controls).forEach(
        ([key, control]: [string, AbstractControl]) => {
          setResourceValueByPath(control, [...path, key]);
        },
      );
    } else if (item instanceof FormArray) {
      // if resource has more items, remove them.
      // Since set will enlarge the array
      // eslint-disable-next-line no-unmodified-loop-condition, sonar/no-infinite-loop
      while (resourceAtPath && item.controls.length < resourceAtPath.length) {
        (resourceAtPath as unknown[]).pop();
      }
      item.controls.forEach((control, index) => {
        setResourceValueByPath(control, [...path, index]);
      });
    } else if (!emptyPath) {
      if (has(formValue, path)) {
        set(newResource, path, newValueAtPath);
      } else {
        unset(newResource, path);
      }
    }
  };

  setResourceValueByPath();

  return newResource;
}

/**
 * Utility function to get all errors from a given control recursively.
 */
export function getControlErrors(
  control: AbstractControl,
): ValidationErrors | null {
  let nestedControlErrors: ValidationErrors | null = null;

  if (control instanceof FormArray || control instanceof FormGroup) {
    nestedControlErrors = Object.entries(
      control.controls,
    ).reduce<ValidationErrors | null>((errors, [key, control]) => {
      const controlErrors = getControlErrors(control);
      return controlErrors == null
        ? errors
        : Object.assign(errors || {}, { [key]: controlErrors });
    }, null);
  }

  const controlErrors = control.errors;

  return (
    (controlErrors || nestedControlErrors) && {
      ...controlErrors,
      ...nestedControlErrors,
    }
  );
}
