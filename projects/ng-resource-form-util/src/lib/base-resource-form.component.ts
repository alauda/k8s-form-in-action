import {
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
import { Observable, Subscription } from 'rxjs';
import { first, map, startWith } from 'rxjs/operators';

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
// <T> refers the type of the resource.
@Directive()
export abstract class BaseResourceFormComponent<
  R extends Object = any,
  F extends Object = R
> implements OnInit, ControlValueAccessor, OnDestroy, AfterViewInit {
  private formValueSub: Subscription;
  private parentFormSub: Subscription;
  private adaptedResource: F;
  private _formModel$: Observable<F>;
  readonly cdr: ChangeDetectorRef;
  readonly fb: FormBuilder;
  readonly ngControl: NgControl;

  @Input()
  updateMode: boolean;

  @Output()
  blur = new EventEmitter();

  @ViewChild(FormGroupDirective, { static: false })
  ngFormGroupDirective: FormGroupDirective;

  disabled = false;
  destroyed = false;

  // Based on scenarios, the form can be a single form control, array or a complex group.
  form: FormControl | FormGroup | FormArray;

  /**
   * Method to create the default form
   */
  abstract createForm(): FormControl | FormGroup | FormArray;

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
   * Wrapps the ControlValueAccessor onChange (cvaConChange) to let
   * the user do some hack before calling onChange
   */
  onChange(formValue: R) {
    this.onCvaChange(formValue);
  }

  onCvaChange = (_: R) => {};
  onCvaTouched = () => {};
  onValidatorChange = () => {};

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
    let formModel = (this.adaptedResource = this.adaptResourceModel(resource));

    // We need to unsub the form value change before setting the form value
    // because the form may emit events when setFormByResource is called.
    this.deregisterObservables();

    this.setupForm();

    if (this.getDefaultFormModel()) {
      formModel = Object.assign(
        cloneDeep(this.getDefaultFormModel()),
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
    if (this.parentFormSub) {
      this.parentFormSub.unsubscribe();
    }
    this.destroyed = true;
  }

  private getInjectable<Token>(
    token: (Function & { prototype: Token }) | InjectionToken<Token>,
    otherwise?: Token,
    flags?: InjectFlags,
  ): Token {
    try {
      return this.injector.get(token as any, otherwise, flags);
    } catch {}
  }

  protected setupForm() {
    if (!this.form) {
      this.form = this.createForm();
    }
  }

  protected registerObservables() {
    this.deregisterObservables();

    this.formValueSub = this.form.valueChanges
      .pipe(
        map((formModel) => {
          if (this.getResourceMergeStrategy()) {
            formModel = setResourceByForm(
              this.form,
              cloneDeep(this.adaptedResource),
            );
          }
          return formModel;
        }),
      )
      .subscribe((value) => {
        this.onChange(this.adaptFormModel(value));
      });
  }

  get controls(): AbstractControl[] {
    if (this.form instanceof FormArray) {
      return this.form.controls;
    } else if (this.form instanceof FormGroup) {
      return Object.values(this.form.controls);
    } else {
      return [this.form];
    }
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
      this.parentFormSub = parentForm.ngSubmit.subscribe((event: Event) => {
        if (this.ngFormGroupDirective) {
          this.ngFormGroupDirective.onSubmit(event);
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
    if (ngControl) {
      const syncValidator = () => {
        if (!this.destroyed && this.form && this.form.invalid) {
          return { [this.constructor.name]: true };
        }
      };
      const asyncValidator = () => {
        return this.form.statusChanges.pipe(
          startWith(this.form.status),
          first((status) => status !== PENDING),
          map(() => syncValidator()),
        );
      };

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
    this.cdr = this.getInjectable(ChangeDetectorRef);
    this.fb = this.getInjectable(FormBuilder);

    // We should only consider fetching the NgControl at the current element:
    this.ngControl = this.getInjectable<NgControl>(
      NgControl,
      undefined,
      InjectFlags.Self,
    );

    this.setupValueAccessor();
  }
}
