import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormArray } from '@angular/forms';

import { PodSpec } from '../types';

import {
  BaseResourceFormGroupComponent,
  PathParam,
} from 'ng-resource-form-util';

@Component({
  selector: 'x-pod-spec-form',
  templateUrl: 'template.html',
  styleUrls: ['styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodSpecFormComponent extends BaseResourceFormGroupComponent<PodSpec> {
  createForm() {
    const validator = (fArray: AbstractControl) => {
      const names: string[] = [];
      for (const control of (fArray as FormArray).controls) {
        const { name } = control.value as { name: string };
        if (!names.includes(name)) {
          names.push(name);
        } else {
          return { duplicatedContainerName: true };
        }
      }
      return null;
    };
    return this.fb.group({
      containers: this.fb.array([], validator),
    });
  }

  pullSecretTrackFn(secret: { name: string }) {
    return secret.name;
  }

  override adaptResourceModel(resource: PodSpec) {
    // Makes sure user will not accidentally remove the last container:
    if (resource && !resource.containers) {
      resource = { ...resource, containers: [{ name: '', image: '' }] };
    }
    return resource;
  }

  getDefaultFormModel(): PodSpec {
    return {
      containers: [{ name: '', image: '' }],
      volumes: [],
    };
  }

  addContainer() {
    this.containersForm.push(this.getNewContainerFormControl());
    this.cdr.markForCheck();
  }

  removeContainer(index: number) {
    this.containersForm.removeAt(index);
  }

  override getOnFormArrayResizeFn() {
    return (path: PathParam) => this.getNewContainerFormControl(path);
  }

  getNewContainerFormControl(path?: PathParam) {
    let index = this.containersForm.length;
    if (path) {
      index = +path[path.length - 1];
    }
    return this.fb.control({ name: `container-${index}`, image: '' });
  }

  get containersForm(): FormArray {
    return this.form.get('containers') as FormArray;
  }

  get volumesForm(): FormArray {
    return this.form.get('volumes') as FormArray;
  }

  trackByFn(index: number) {
    return index;
  }
}
