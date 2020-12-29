import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { RequestThrottler } from './request-throttler';

@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestThrottler,
      multi: true
    }
  ]
})
export class RequestThrottlerModule { }
