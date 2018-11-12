import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'x-form-section',
  templateUrl: './template.html',
  styleUrls: ['./style.css'],
})
export class FormSectionComponent {
  @Input() @HostBinding('attr.label') label: string;
}
