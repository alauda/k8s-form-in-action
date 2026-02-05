import { ChangeDetectionStrategy, Component } from '@angular/core'

import { DemoComponent } from './demo/component'

@Component({
  selector: 'x-root',
  templateUrl: './app.component.html',
  imports: [DemoComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'k8s-form-in-action'
}
