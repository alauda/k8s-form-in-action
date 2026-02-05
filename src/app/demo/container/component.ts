import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { ReactiveFormsModule, Validators } from '@angular/forms'

import { FormSectionComponent } from '../form-section/component'
import { Container } from '../types'

import { BaseResourceFormGroupComponent } from 'ng-resource-form-util'

@Component({
  selector: 'x-container-form',
  templateUrl: 'template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormSectionComponent],
})
export class ContainerFormComponent extends BaseResourceFormGroupComponent<Container> {
  createForm() {
    return this.fb.group({
      name: [
        '',
        [Validators.required, Validators.pattern(/^[\da-z][\da-z-]*[\da-z]$/)],
      ],
      image: [''],
    })
  }
}
