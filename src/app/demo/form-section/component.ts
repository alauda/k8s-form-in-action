import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
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
import { isEqual } from 'lodash-es';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { KeyValue, KeyValueFormComponent } from '../key-value-form/component';
import { PathProviderService } from '../path.service';

@Component({
  selector: 'x-form-section',
  templateUrl: 'template.html',
  styleUrls: ['styles.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FormSectionComponent implements AfterViewInit, OnDestroy {
  get label() {
    let label: string | undefined;
    if (this.cc) {
      label = String(this.cc.name);
    } else if (this.nc) {
      label = String(this.nc.name);
    }
    return label!;
  }

  @Input() noPathIntelligence = false;

  @HostBinding('class.invalid')
  get invalid() {
    return this.control?.invalid;
  }

  @HostBinding('attr.status')
  get status() {
    if (this.control) {
      const partials = [
        this.control.status,
        this.control.dirty ? 'dirty' : 'pristine',
        this.control.touched ? 'touched' : 'untouched',
        this.formGroupDirective.submitted ? 'submitted' : '',
      ];
      return partials.filter(s => !!s).join(', ');
    }
    return null;
  }

  @HostBinding('attr.title')
  get title() {
    return this.path.length > 0 ? `[${this.path.join(', ')}]` : undefined;
  }

  get path(): string[] {
    // Strips off the root form, since we don't want to use 'UI' here:
    return this.parent
      ? [
          ...this.parent.path,
          this.keyValueForm
            ? (this.keyValueForm.form.get(this.label)?.value as KeyValue)[0]
            : this.label,
        ]
      : [];
  }

  get control(): AbstractControlDirective {
    return this.cc || this.nc;
  }

  get formGroupDirective(): FormGroupDirective {
    return this.fgd || this.parent?.formGroupDirective;
  }

  destroy$$ = new Subject<void>();

  constructor(
    @Optional() @SkipSelf() private readonly parent: FormSectionComponent,
    @Optional() @Self() private readonly cc: ControlContainer,
    @Optional() private readonly fgd: FormGroupDirective,
    @Optional() private readonly keyValueForm: KeyValueFormComponent,
    private readonly cdr: ChangeDetectorRef,
    private readonly pathProvider: PathProviderService,
  ) {}

  @ContentChild(NgControl, { static: false })
  nc?: NgControl;

  @HostBinding('class.active') active = false;

  @HostBinding('attr.label')
  get labelRendered() {
    return (/^\d+$/.test(this.label) ? '#' : '') + this.label;
  }

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    if (!this.noPathIntelligence) {
      event.stopPropagation();
      this.pathProvider.subject.next(this.path);
    }
  }

  ngAfterViewInit() {
    this.pathProvider.subject
      .pipe(takeUntil(this.destroy$$))
      .subscribe(path => {
        this.active = !this.noPathIntelligence && isEqual(path, this.path);
        this.cdr.markForCheck();
      });

    this.control?.statusChanges
      ?.pipe(takeUntil(this.destroy$$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$$.next();
    this.destroy$$.complete();
  }
}
