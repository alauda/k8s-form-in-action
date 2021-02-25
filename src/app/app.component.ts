import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'x-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'k8s-form-in-action';
}
