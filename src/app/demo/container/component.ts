import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseResourceFormGroupComponent } from 'ng-resource-form-util';

import { Container } from '../types';

const DEFAULT_CONTAINER: Container = {
  name: '',
  image: '',
};

@Component({
  selector: 'x-container-form',
  templateUrl: './template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerFormComponent extends BaseResourceFormGroupComponent<Container> {
  createForm() {
    return this.fb.group({
      name: [
        '',
        [Validators.required, Validators.pattern(/^[\da-z][\da-z-]*[\da-z]$/)],
      ],
      image: [],
    });
  }

  getDefaultFormModel() {
    return DEFAULT_CONTAINER;
  }
}
