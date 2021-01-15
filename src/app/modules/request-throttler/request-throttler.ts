import { CommonModule } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { Observable, Subscriber, Subscription } from 'rxjs';
import { RequestInformerService } from 'src/app/services/request-informer/request-informer.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class RequestThrottler implements HttpInterceptor {

  private static readonly THROTTLE_LIMIT = 16;

  private runningRequestLoops = 0;
  private requestQueue: [
    Subscriber<HttpEvent<any>>,
    Observable<HttpEvent<any>>,
    Subscription
  ][] = [];

  constructor(
    private requestInformer: RequestInformerService,
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable<HttpEvent<any>>((observer) => {

      const observable = next.handle(req);
      const subscription = new Subscription;
      this.requestQueue.push([observer, observable, subscription]);

      if (this.runningRequestLoops < RequestThrottler.THROTTLE_LIMIT) {
        this.startNewRequestLoop();
      }
      return () => subscription.unsubscribe();

    });
  }

  async startNewRequestLoop() {
    this.requestInformer.isLoading.next(true);
    this.runningRequestLoops += 1;

    while (this.requestQueue.length > 0) {

      const [observer, observable, subscription] = this.requestQueue.shift();

      if (subscription.closed) {
        continue;
      }

      try {
        const response = await observable.toPromise();
        observer.next(response);
      } catch (err) {
        observer.error(err);
      } finally {
        observer.complete();
      }

    }

    this.runningRequestLoops -= 1;
    this.requestInformer.isLoading.next(this.totalRequests() > 0);
  }

  totalRequests(): number {
    return this.requestQueue.length + this.runningRequestLoops;
  }

}
