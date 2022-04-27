import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';

import { BaseResourceFormGroupComponent } from 'ng-resource-form-util';

interface Spec {
  name: string;
  step?: any;
}

@Component({
  selector: 'x-v-spec-form',
  templateUrl: 'template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VSpecFormComponent
  extends BaseResourceFormGroupComponent<Spec>
  implements OnInit
{
  show = false;

  createForm() {
    return this.fb.group({
      name: ['', [Validators.required]],
      step: [],
    });
  }

  getDefaultFormModel() {
    return {
      name: '',
      step: '',
    };
  }

  override ngOnInit() {
    this.form.valueChanges.subscribe(() => {
      console.log('VSpecFormComponent', this.form);
    });
  }

  close() {
    this.show = false;
  }

  show1() {
    this.show = true;
  }
}
