import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';

import { BaseResourceFormGroupComponent } from 'ng-resource-form-util';

interface Step {
  name: string;
  time: number;
}

@Component({
  selector: 'x-v-spec-step-form',
  templateUrl: 'template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VSpecStepFormComponent
  extends BaseResourceFormGroupComponent<Step>
  implements OnInit
{
  createForm() {
    return this.fb.group({
      name: [
        '',
        [Validators.required, Validators.pattern(/^[\da-z][\da-z-]*[\da-z]$/)],
      ],
      time: [],
    });
  }

  getDefaultFormModel() {
    return {
      name: '',
      time: 0,
    };
  }

  override ngOnInit() {
    this.form.valueChanges.subscribe(() => {
      console.log('VSpecStepFormComponent', this.form);
    });
  }
}
