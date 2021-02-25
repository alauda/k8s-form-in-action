/* eslint-disable sonarjs/no-duplicate-string */

import { TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { setFormByResource, setResourceByForm } from './util';

describe('form utilities', () => {
  let fb: FormBuilder;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
    });

    fb = TestBed.inject(FormBuilder);
  });

  it('setFormByResource', () => {
    const resource = {
      simple: 'simple value',
      'non-existing': 'non-existing value',
      nested: {
        nestedA: 'nestedA value',
        nestedB: 'nestedB value',
        'nested-non-existing': 'nested-non-existing',
        nestedArray: ['na A', 'na B', 'na C'],
        nestedNested: {
          nestedNestedA: 'nestedNestedA value',
        },
      },
      array: ['b'],
    };

    const form = fb.group({
      simple: [''],
      nested: fb.group({
        nestedA: [''],
        nestedB: [''],
        nestedArray: fb.array(['']),
        nestedNested: fb.group({
          nestedNestedA: [''],
        }),
      }),
      array: fb.array(['a', 'b']),
    });

    setFormByResource(form, resource, () => fb.control(''));

    expect(form.value).toEqual({
      simple: 'simple value',
      nested: {
        nestedA: 'nestedA value',
        nestedB: 'nestedB value',
        nestedArray: ['na A', 'na B', 'na C'],
        nestedNested: { nestedNestedA: 'nestedNestedA value' },
      },
      array: ['b'],
    });

    expect((form.get(['array']) as FormArray).length).toBe(1);
    expect((form.get(['nested', 'nestedArray']) as FormArray).length).toBe(3);
  });

  it('setResourceByForm', () => {
    const form = fb.group({
      simple: ['simple value'],
      nested: fb.group({
        nestedA: ['nestedA value'],
        nestedB: ['nestedB value'],
        nestedArray: fb.array(['na A', 'na B', 'na C']),
        nestedNested: fb.group({
          nestedNestedA: ['nestedNestedA value'],
        }),
      }),
      array: fb.array(['a', 'b']),
    });

    const resource = {
      simple: '',
      'non-existing': 'non-existing value',
      nested: {
        nestedA: '',
        nestedB: '',
        'nested-non-existing': 'nested-non-existing',
        nestedArray: ['na A', 'na B', 'na C', 'na D'],
        nestedNested: {
          nestedNestedA: '',
        },
      },
      array: ['b'],
    };

    const newResource = setResourceByForm(form, resource);

    expect(newResource).toEqual({
      simple: 'simple value',
      'non-existing': 'non-existing value',
      nested: {
        nestedA: 'nestedA value',
        nestedB: 'nestedB value',
        'nested-non-existing': 'nested-non-existing',
        nestedArray: ['na A', 'na B', 'na C'],
        nestedNested: { nestedNestedA: 'nestedNestedA value' },
      },
      array: ['a', 'b'],
    });
  });
});
