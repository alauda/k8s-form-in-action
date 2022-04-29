import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';

import { Container } from '../types';

import { BaseResourceFormGroupComponent } from 'ng-resource-form-util';

@Component({
  selector: 'x-container-form',
  templateUrl: 'template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerFormComponent extends BaseResourceFormGroupComponent<Container> {
  createForm() {
    return this.fb.group({
      name: [
        '',
        [Validators.required, Validators.pattern(/^[\da-z][\da-z-]*[\da-z]$/)],
      ],
      image: [''],
    });
  }
}
