import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'x-v-form',
  templateUrl: 'template.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VFormComponent implements OnInit {
  vForm = this.fb.group({
    spec: ['', Validators.required],
  });

  show = false;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.vForm.valueChanges.subscribe(() => {
      console.log(this.vForm);
    });
  }

  close() {
    this.show = false;
  }

  show1() {
    this.show = true;
  }
}
