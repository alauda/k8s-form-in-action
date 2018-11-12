import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  HostBinding,
  HostListener,
  Optional,
  Self,
  SkipSelf,
} from '@angular/core';
import {
  AbstractControlDirective,
  ControlContainer,
  FormGroupDirective,
  NgControl,
} from '@angular/forms';

import { PathProviderService } from '../path.service';

@Component({
  selector: 'x-form-section',
  templateUrl: './template.html',
  styleUrls: ['./style.css'],
  changeDetection: ChangeDetectionStrategy.Default,
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
      const partials = [
        this.control.dirty ? 'dirty' : 'pristine',
        this.control.touched ? 'touched' : 'untouched',
        this.formGroupDirective.submitted ? 'submitted' : '',
      ];
      return partials.filter(s => !!s).join(', ');
    }
    return this.control && this.control.status;
  }

  @HostBinding('attr.title')
  get title() {
    return `[${this.path.join(', ')}]`;
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    event.stopPropagation();
    this.pathProvider.subject.next(this.path);
  }

  get path(): string[] {
    // Strips off the root form, since we don't want to use 'UI' here:
    return this.parent ? [...this.parent.path, this.label] : [];
  }

  get control(): AbstractControlDirective {
    return this.cc || this.nc;
  }

  get formGroupDirective(): FormGroupDirective {
    return this.fgd || (this.parent && this.parent.formGroupDirective);
  }

  constructor(
    @Optional() @SkipSelf() public parent: FormSectionComponent,
    @Optional() @Self() public cc: ControlContainer,
    @Optional() public fgd: FormGroupDirective,
    public pathProvider: PathProviderService,
  ) {}
}
