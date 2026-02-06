import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core'
import { MonacoEditorModule, MonacoProviderService } from 'ng-monaco-editor'

import { CustomMonacoProviderService } from './monaco-provider.service'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: MonacoProviderService,
      useClass: CustomMonacoProviderService,
    },
    importProvidersFrom(
      MonacoEditorModule.forRoot({
        dynamicImport: () => import('monaco-editor'),
      }),
    ),
  ],
}
