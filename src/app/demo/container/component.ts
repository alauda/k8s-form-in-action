import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  forwardRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { BaseResourceFormGroupComponent } from 'ng-resource-form-util';

import { Container } from '../types';

const DEFAULT_CONTAINER: Container = {
  name: '',
  image: '',
};

@Component({
  selector: 'x-container-form',
  templateUrl: './template.html',
  styleUrls: ['./style.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContainerFormComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerFormComponent extends BaseResourceFormGroupComponent<
  Container
> {
  constructor(injector: Injector) {
    super(injector);
  }

  createForm() {
    return this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
        ],
      ],
      image: [],
    });
  }

  getDefaultFormModel() {
    return DEFAULT_CONTAINER;
  }
}
