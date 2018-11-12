import {
  Component,
  ContentChild,
  HostBinding,
  Optional,
  Self,
} from '@angular/core';
import {
  AbstractControlDirective,
  ControlContainer,
  NgControl,
} from '@angular/forms';

@Component({
  selector: 'x-form-section',
  templateUrl: './template.html',
  styleUrls: ['./style.css'],
})
export class FormSectionComponent {
  @ContentChild(NgControl) nc: NgControl;

  @HostBinding('attr.label')
  get label() {
    if (this.cc) {
      return this.cc.name;
    } else if (this.nc) {
      return this.nc.name;
    }
  }

  @HostBinding('class.invalid')
  get invalid() {
    return this.control && this.control.invalid;
  }

  @HostBinding('attr.status')
  get status() {
    if (this.control) {
      return [
        this.control.status,
        this.control.dirty ? 'dirty' : 'pristine',
        this.control.touched ? 'touched' : 'untouched',
      ].join(', ');
    }
    return this.control && this.control.status;
  }

  get control(): AbstractControlDirective {
    return this.cc || this.nc;
  }

  constructor(@Optional() @Self() public cc: ControlContainer) {}
}
