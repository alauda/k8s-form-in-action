import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'

import { FormSectionComponent } from '../form-section/component'
import { KeyValueFormComponent } from '../key-value-form/component'
import { PodSpecFormComponent } from '../pod-spec/component'
import { Deployment, DeploymentTypeMeta } from '../types'

import { BaseResourceFormGroupComponent } from 'packages/ng-resource-form-util/src/public-api'

@Component({
  selector: 'x-deployment',
  templateUrl: 'template.html',
  styleUrls: ['styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormSectionComponent,
    KeyValueFormComponent,
    PodSpecFormComponent,
  ],
})
export class DeploymentFormComponent extends BaseResourceFormGroupComponent<Deployment> {
  namespaces = ['default', 'kube-system']

  createForm(): FormGroup {
    const metadataForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.pattern(/^[\da-z][\da-z-]*[\da-z]$/)],
        () =>
          new Promise(resolve => {
            setTimeout(resolve, 2000)
          }),
      ],
      namespace: ['', [Validators.required]],
      labels: [{}],
      annotations: [{}],
    })

    const specForm = this.fb.group({
      selector: this.fb.group({
        matchLabels: [{}],
      }),
      replicas: [1, [Validators.min(0)]],
      template: this.fb.group({
        spec: [{}],
        metadata: this.fb.group({
          labels: [{}],
        }),
      }),
      revisionHistoryLimit: [],
    })

    return this.fb.group({
      metadata: metadataForm,
      spec: specForm,
    })
  }

  override getDefaultFormModel() {
    return DeploymentTypeMeta
  }
}
