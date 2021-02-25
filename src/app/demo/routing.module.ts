import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DemoComponent } from './component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'full',
        component: DemoComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class DemoRoutingModule {}
