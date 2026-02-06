import { InjectionToken } from '@angular/core'
import { FormGroup } from '@angular/forms'

export interface KeyValueFormLike {
  form: FormGroup
}

export const KEY_VALUE_FORM = new InjectionToken<KeyValueFormLike>(
  'KEY_VALUE_FORM',
)
