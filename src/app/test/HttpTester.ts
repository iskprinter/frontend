import { HttpTestingController } from '@angular/common/http/testing';

export type RequestFunction<T> = () => Promise<T>;

export interface HttpTestSettings<T> {
  requestFunction: RequestFunction<T>;
  responses: {
    method: string,
    url: string,
    body: string,
    options?: {
      status: number,
      statusText: string
    }
  }[];
};

export class HttpTester {

  requestPollinterval = 100; // ms

  constructor(
    private httpTestingController: HttpTestingController
  ) { }

  async test<T>({ requestFunction, responses }: HttpTestSettings<T>): Promise<T> {

    const pendingPromise = requestFunction();

    for (const response of responses) {

      while ((this.httpTestingController as any).open.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, this.requestPollinterval));
      }
      const req = this.httpTestingController.expectOne({ method: response.method, url: response.url });
      req.flush(response.body, response.options);

    }

    return pendingPromise;

  };

};

export async function blockUntilRequestReceived(httpMock: HttpTestingController): Promise<void> {
  const INTERVAL = 100; // ms
  while ((httpMock as any).open.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, INTERVAL));
  }
};
