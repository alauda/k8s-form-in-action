import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { cloneDeep, get, isEqual, set, unset } from 'lodash-es';

export type OnFormArrayResizeFn = (path: PathParam) => AbstractControl;
export type PathParam = (string | number)[];

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
export function setFormByResource<R extends Object>(
  form: AbstractControl,
  resource: R,
  onFormArrayResize?: OnFormArrayResizeFn,
): void {
  let newFormValue = cloneDeep(form.value);
  const setFormValueByPath = (
    item: AbstractControl,
    pathToOrigin: PathParam = [],
  ) => {
    const newValueAtPath =
      pathToOrigin.length > 0 ? get(resource, pathToOrigin) : resource;
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
    } else {
      set(newFormValue, pathToOrigin, newValueAtPath);
    }
  };

  if (form instanceof FormControl) {
    newFormValue = resource;
  } else {
    setFormValueByPath(form);
  }

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
export function setResourceByForm<R extends Object>(
  form: AbstractControl,
  resource: R,
): R {
  const newResource = cloneDeep<R>(resource || ({} as any));
  const formValue = form.value;

  const setResourceValueByPath = (
    item: AbstractControl = form,
    path: PathParam = [],
  ) => {
    let newValueAtPath = get(formValue, path);
    const resourceAtPath = get(newResource, path);

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
      while (resourceAtPath && item.controls.length < resourceAtPath.length) {
        (resourceAtPath as Array<any>).pop();
      }
      item.controls.forEach((control, index) => {
        setResourceValueByPath(control, [...path, index]);
      });
    } else {
      if (newValueAtPath !== undefined) {
        set(newResource, path, newValueAtPath);
      } else {
        unset(newResource, path);
      }
    }
  };

  if (!(form instanceof FormControl)) {
    setResourceValueByPath();
  }

  return newResource;
}
