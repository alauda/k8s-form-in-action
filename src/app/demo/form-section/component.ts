import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
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
import { isEqual } from 'lodash';
import { Subscription } from 'rxjs';

import { PathProviderService } from '../path.service';

@Component({
  selector: 'x-form-section',
  templateUrl: './template.html',
  styleUrls: ['./style.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FormSectionComponent implements OnInit, OnDestroy {
  get label() {
    let label: string;
    if (this.cc) {
      label = this.cc.name;
    } else if (this.nc) {
      label = this.nc.name;
    }

    return label;
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
    return this.path.length > 0 ? `[${this.path.join(', ')}]` : undefined;
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
    private cdr: ChangeDetectorRef,
    public pathProvider: PathProviderService,
  ) {}
  private sub: Subscription;
  @ContentChild(NgControl) nc: NgControl;

  @HostBinding('class.active') active = false;

  @HostBinding('attr.label')
  get labelRendered() {
    let label = this.label;
    if (!isNaN(+label)) {
      label = `#${label}`;
    }
    return label;
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    event.stopPropagation();
    this.pathProvider.subject.next(this.path);
  }

  ngOnInit() {
    this.sub = this.pathProvider.subject.subscribe(path => {
      this.active = isEqual(path, this.path);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
