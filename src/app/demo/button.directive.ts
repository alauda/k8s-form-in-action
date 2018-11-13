import { Directive, HostBinding, Input } from '@angular/core';

// Button by default has 'submit' attributes inside forms. We want to override here:
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'button',
})
export class ButtonDirective {
  @Input() type: string;

  @HostBinding('attr.type')
  get typeBinding() {
    return this.type || 'button';
  }
}
