import {
  AbstractType,
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  EventEmitter,
  InjectFlags,
  InjectionToken,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Type,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import { cloneDeep } from 'lodash-es';
import {
  Observable,
  Subject,
  Subscription,
  first,
  map,
  startWith,
  takeUntil,
  ReplaySubject,
} from 'rxjs';

import {
  OnFormArrayResizeFn,
  setFormByResource,
  setResourceByForm,
} from './util';

/**
 * Reports that a FormControl is pending, meaning that that async validation is occurring and
 * errors are not yet available for the input value.
 */
export const PENDING = 'PENDING';

// Base form component for Resources.
// <R> refers the type of the resource.
@Directive()
export abstract class BaseResourceFormComponent<
  R = unknown,
  F = R,
  Control extends AbstractControl = FormControl,
> implements OnInit, ControlValueAccessor, OnDestroy, AfterViewInit
{
  private formValueSub?: Subscription;
  private adaptedResource!: F;
  private _formModel$?: Observable<F>;
  private _resourceModel!: R;
  private readonly _resourceModel$$ = new ReplaySubject<R>(1);

  private readonly _destroy$$ = new Subject<void>();

  readonly cdr: ChangeDetectorRef;
  readonly fb: FormBuilder;
  readonly ngControl: NgControl;

  readonly resource$ = this._resourceModel$$.asObservable();
  readonly destroy$ = this._destroy$$.asObservable();

  @Input()
  updateMode?: boolean;

  @Output()
  // eslint-disable-next-line @angular-eslint/no-output-native
  blur = new EventEmitter<void>();

  @ViewChild(FormGroupDirective, { static: false })
  ngFormGroupDirective?: FormGroupDirective;

  disabled = false;

  // Based on scenarios, the form can be a single form control, array or a complex group.
  form!: Control;

  /**
   * Method to create the default form
   */
  abstract createForm(): Control;

  /**
   * The default form model
   */
  abstract getDefaultFormModel(): F;

  /**
   * Whether or not to merge the form
   * - When merge with the default model upon form initializing
   * - When with the adapted input resource upon onChange
   */
  abstract getResourceMergeStrategy(): boolean;

  /**
   * Returns the incoming resource value
   */
  get resourceModel(): R {
    return this._resourceModel;
  }

  /**
   * Returns the embedded form value
   */
  get formModel(): F {
    return this.form.value;
  }

  get formModel$(): Observable<F> {
    if (!this._formModel$) {
      this._formModel$ = this.form.valueChanges.pipe(
        startWith(this.form.value),
      );
    }
    return this._formModel$;
  }

  /**
   * Adapts the resource to form Model.
   *
   * Will be called in [writeValue]
   */
  adaptResourceModel(resource: R): F {
    return resource as any;
  }

  /**
   * Adapts the form model to the resource Model
   *
   * Will be called in [onChange]
   */
  adaptFormModel(formModel: F): R {
    return formModel as any;
  }

  /**
   * Provide an optional function to be used when the given form is not with
   * correct size.
   */
  getOnFormArrayResizeFn(): OnFormArrayResizeFn {
    return () => new FormControl();
  }

  /**
   * Wraps the ControlValueAccessor onChange (cvaConChange) to let
   * the user do some hack before calling onChange
   */
  onChange(formValue: R) {
    this.onCvaChange(formValue);
  }

  /* eslint-disable @typescript-eslint/no-empty-function */
  onCvaChange = (_: R) => {};
  onCvaTouched = () => {};
  onValidatorChange = () => {};
  /* eslint-enable @typescript-eslint/no-empty-function */

  /**
   * To be bound to the template.
   */
  onBlur() {
    this.onCvaTouched();
    this.blur.emit();
  }

  registerOnChange(fn: (value: R) => void): void {
    this.onCvaChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onCvaTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.form[isDisabled ? 'disable' : 'enable']();
  }

  writeValue(resource: R) {
    this._resourceModel$$.next((this._resourceModel = resource));

    let formModel = (this.adaptedResource = this.adaptResourceModel(resource));

    // We need to unsubscribe the form value change before setting the form value
    // because the form may emit events when setFormByResource is called.
    this.deregisterObservables();

    this.setupForm();

    const defaultModel = this.getDefaultFormModel();

    if (defaultModel && typeof defaultModel === 'object') {
      formModel = Object.assign(
        cloneDeep(defaultModel as F & object),
        formModel,
      );
    }

    setFormByResource(this.form, formModel, this.getOnFormArrayResizeFn());

    this.registerObservables();

    this.cdr.markForCheck();
  }

  registerOnValidatorChange(fn: () => void) {
    this.onValidatorChange = fn;
  }

  ngOnInit() {
    this.setupForm();
  }

  ngAfterViewInit() {
    this.setupSubmitEvent();
    this.setupValidators();
  }

  ngOnDestroy() {
    this.deregisterObservables();
    this._destroy$$.next();
    this._destroy$$.complete();
  }

  private getInjectable<T>(
    token: Type<T> | AbstractType<T> | InjectionToken<T>,
    otherwise?: T | null,
    flags?: InjectFlags,
  ) {
    try {
      return this.injector.get(token, otherwise, flags);
    } catch {
      return null;
    }
  }

  protected setupForm() {
    if (!this.form) {
      this.form = this.createForm();
    }
  }

  protected registerObservables() {
    this.deregisterObservables();

    this.formValueSub = (this.form.valueChanges as Observable<F>)
      .pipe(
        map(formModel => {
          if (
            this.getResourceMergeStrategy() &&
            this.adaptedResource &&
            typeof this.adaptedResource === 'object'
          ) {
            formModel = setResourceByForm(
              this.form,
              this.adaptedResource as F & object,
            );
          }
          return formModel;
        }),
      )
      .subscribe(value => {
        this.onChange(this.adaptFormModel(value));
      });
  }

  get controls(): AbstractControl[] {
    if (this.form instanceof FormArray) {
      return this.form.controls;
    }
    if (this.form instanceof FormGroup) {
      return Object.values(this.form.controls);
    }
    return [this.form];
  }

  protected deregisterObservables() {
    if (this.formValueSub) {
      this.formValueSub.unsubscribe();
      this.formValueSub = undefined;
    }
  }

  private setupSubmitEvent() {
    const parentForm =
      this.getInjectable(FormGroupDirective) || this.getInjectable(NgForm);
    if (parentForm) {
      parentForm.ngSubmit
        .pipe(startWith(parentForm.submitted), takeUntil(this._destroy$$))
        .subscribe((event: Event | boolean) => {
          if (event === false) {
            return;
          }
          if (this.ngFormGroupDirective) {
            this.ngFormGroupDirective.onSubmit(event === true ? null! : event);
          }
          this.form.updateValueAndValidity();
          this.cdr.markForCheck();
        });
    }
  }

  /**
   * setupValidators / setupValueAccessor let the users get rid of repeating
   * providing validators/value accessors themselves.
   */
  private setupValidators() {
    const ngControl = this.ngControl;
    if (ngControl?.control) {
      const syncValidator = () => {
        if (this.form?.invalid) {
          return { [this.constructor.name]: true };
        }
        return null;
      };
      const asyncValidator = () =>
        this.form.statusChanges.pipe(
          startWith(this.form.status),
          first(status => status !== PENDING),
          map(() => syncValidator()),
        );

      // Attach nested validation status to the interface:
      ngControl.control.validator = Validators.compose([
        ngControl.control.validator,
        syncValidator,
      ]);

      ngControl.control.asyncValidator = Validators.composeAsync([
        ngControl.control.asyncValidator,
        asyncValidator,
      ]);
    }
  }

  /**
   * setupValidators / setupValueAccessor let the users get rid of repeating
   * providing validators/value accessors themselves.
   */
  private setupValueAccessor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  constructor(public injector: Injector) {
    this.cdr = this.getInjectable(ChangeDetectorRef)!;
    this.fb = this.getInjectable(FormBuilder)!;

    // We should only consider fetching the NgControl at the current element:
    this.ngControl = this.getInjectable<NgControl>(
      NgControl,
      null,
      InjectFlags.Self,
    )!;

    this.setupValueAccessor();
  }
}
