import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { BaseResourceFormGroupComponent } from './base-resource-form-group.component';

interface TestResource {
  simple?: string;
  array?: string; // separated by dots, value is number
  ignored?: string; // will be ignored in ui
  defaultField?: string; // has no UI control, but will be filled when write back to the resource
}

interface TestResourceFormModel {
  simple?: string;
  array?: string[];
  ignored?: string; // will be ignored in ui
  defaultField?: string; // has no UI control, but will be filled when write back to the resource
}

@Component({
  selector: 'lib-test-resource-form',
  template: `
    <form [formGroup]="form">
      <input
        #simpleInput
        formControlName="simple"
        (blur)="onBlur()"
      />
      <input
        class="array-input"
        *ngFor="let item of $any(form.get('array')).controls"
        [formControl]="item"
        (blur)="onBlur()"
      />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestResourceFormComponent extends BaseResourceFormGroupComponent<
  TestResource,
  TestResourceFormModel
> {
  @ViewChild(FormGroupDirective, { static: false })
  formDir!: FormGroupDirective;

  @ViewChild('simpleInput', { static: false })
  simpleInput!: ElementRef;

  constructor(private readonly elementRef: ElementRef, injector: Injector) {
    super(injector);
  }

  createForm() {
    return this.fb.group({
      simple: ['', Validators.required],
      array: this.fb.array([]),
    });
  }

  simulateManualInput(text: string) {
    const el = this.simpleInput.nativeElement as HTMLInputElement;
    el.value = text;
    el.dispatchEvent(new Event('input'));
  }

  simulateManualInputArray(texts: string[]) {
    texts.forEach((text, index) => {
      const el = this.arrayInputs[index];
      el.value = text;
      el.dispatchEvent(new Event('input'));
    });
  }

  simulateBlur() {
    const el = this.simpleInput.nativeElement as HTMLInputElement;
    el.dispatchEvent(new FocusEvent('blur'));
  }

  override adaptResourceModel(resource: TestResource) {
    return {
      ...resource,
      array: (resource.array || '')
        .split(',')
        .map(item => item.trim())
        .filter(item => !!item),
    };
  }

  override adaptFormModel(formModel: TestResourceFormModel) {
    return {
      ...formModel,
      array: formModel.array?.map(item => +item).join(','),
      defaultField: 'DEFAULT',
    };
  }

  private get arrayInputs() {
    return (
      this.elementRef.nativeElement as HTMLElement
    ).querySelectorAll<HTMLInputElement>('input.array-input');
  }
}

// tslint:disable-next-line: max-classes-per-file
@Component({
  template: `
    <form [formGroup]="form">
      <lib-test-resource-form
        formControlName="default"
      ></lib-test-resource-form>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestResourceFormWrapperComponent implements OnInit {
  @Input()
  set resource(resource: any) {
    this.control.setValue(resource);
  }

  get resource() {
    return this.control.value;
  }

  @Output()
  resourceChange = new EventEmitter();

  @ViewChild(FormGroupDirective, { static: false })
  formDir!: FormGroupDirective;

  @ViewChild(TestResourceFormComponent, { static: false })
  resourceForm!: TestResourceFormComponent;

  control = new FormControl();

  form!: FormGroup;

  ngOnInit() {
    this.control.valueChanges.subscribe(value =>
      this.resourceChange.emit(value),
    );

    this.form = new FormGroup({ default: this.control });
  }
}

describe('BaseResourceFormGroupComponent', () => {
  let fixture: ComponentFixture<TestResourceFormWrapperComponent>;
  let wrapper: TestResourceFormWrapperComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule],
      declarations: [
        TestResourceFormComponent,
        TestResourceFormWrapperComponent,
      ],
    });

    fixture = TestBed.createComponent(TestResourceFormWrapperComponent);
    wrapper = fixture.componentRef.instance;
  });

  it('should create a form', () => {
    expect(wrapper.form).toBeFalsy();
    wrapper.resource = { simple: '123', ignored: 456 };
    fixture.detectChanges();
    expect(wrapper.form).toBeTruthy();
  });

  it('form should be correctly initialized', () => {
    wrapper.resource = { simple: '123', ignored: 456, array: '0,1 ,2' };
    fixture.detectChanges();

    expect(wrapper.resource).toEqual({
      simple: '123',
      ignored: 456,
      array: '0,1 ,2',
    });
    expect(wrapper.formDir.pristine).toEqual(true);
    expect(wrapper.formDir.dirty).toEqual(false);
    expect(wrapper.formDir.submitted).toEqual(false);
    expect(wrapper.resourceForm.form.value).toEqual({
      simple: '123',
      array: ['0', '1', '2'],
    });
    expect(
      (wrapper.resourceForm.form.get('array') as FormArray).length,
    ).toEqual(3);
  });

  it('nested form should be submitted', () => {
    wrapper.resource = { simple: '123', ignored: 456 };
    fixture.detectChanges();

    wrapper.formDir.onSubmit(null!);

    expect(wrapper.resourceForm.formDir.submitted).toEqual(true);
  });

  it('resource value change should be correctly updated', () => {
    wrapper.resource = { simple: '123', ignored: 456 };
    fixture.detectChanges();
    wrapper.resourceForm.simulateManualInput('444');
    fixture.detectChanges();
    expect(wrapper.resource).toEqual({
      simple: '444',
      ignored: 456,
      array: '',
      defaultField: 'DEFAULT',
    });
  });

  it('resource value change should be correctly updated for array', () => {
    wrapper.resource = { simple: '123', ignored: 456, array: '0,1 ,2' };
    fixture.detectChanges();
    wrapper.resourceForm.simulateManualInputArray(['2', '3', '4']);
    fixture.detectChanges();
    expect(wrapper.resource).toEqual({
      simple: '123',
      ignored: 456,
      array: '2,3,4',
      defaultField: 'DEFAULT',
    });
  });

  it('error status should be popped up', () => {
    wrapper.resource = { simple: '123', ignored: 456 };
    fixture.detectChanges();
    wrapper.resourceForm.simulateManualInput('');
    fixture.detectChanges();
    expect(wrapper.form.invalid).toEqual(true);
  });

  it('touch should be handled correctly', () => {
    wrapper.resource = { simple: '123', ignored: 456 };
    fixture.detectChanges();
    expect(wrapper.form.touched).toEqual(false);

    wrapper.resourceForm.simulateBlur();
    fixture.detectChanges();
    expect(wrapper.form.touched).toEqual(true);
  });

  it('should change form disabled state correctly', () => {
    wrapper.resource = { simple: '123', ignored: 456 };
    fixture.detectChanges();

    wrapper.form.disable();
    fixture.detectChanges();
    expect(wrapper.resourceForm.form.disabled).toEqual(true);

    wrapper.form.enable();
    fixture.detectChanges();
    expect(wrapper.resourceForm.form.disabled).toEqual(false);
  });
});
