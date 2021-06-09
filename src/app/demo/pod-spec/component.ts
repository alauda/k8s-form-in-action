import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormArray } from '@angular/forms';
import {
  BaseResourceFormGroupComponent,
  PathParam,
} from 'ng-resource-form-util';

import { PodSpec } from '../types';

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
        const { name } = control.value;
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

  adaptResourceModel(resource: PodSpec) {
    // Makes sure user will not accidently remove the last container:
    if (resource && !resource.containers) {
      resource = { ...resource, containers: [{ name: '', image: '' }] };
    }
    return resource;
  }

  getDefaultFormModel(): PodSpec {
    return {
      containers: [{ name: '', image: '' }],
      volumes: [] as any,
    };
  }

  addContainer() {
    this.containersForm.push(this.getNewContainerFormControl());
    this.cdr.markForCheck();
  }

  removeContainer(index: number) {
    this.containersForm.removeAt(index);
  }

  getOnFormArrayResizeFn() {
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
