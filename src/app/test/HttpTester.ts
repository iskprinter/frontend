import { HttpTestingController } from '@angular/common/http/testing';

type RequestFunction<T> = () => Promise<T>;

interface HttpTestSettings<T> {
  requestFunction: RequestFunction<T>;
  transactions: {
    request: {
      methodOracle: string,
      urlOracle: string,
      bodyOracle?: any
    },
    response: {
      body: any,
      options?: {
        status: number,
        statusText: string
      }
    }
  }[];
};

export class HttpTester {

  requestPollinterval = 100; // ms

  constructor(
    private httpTestingController: HttpTestingController
  ) { }

  async test<T>({ requestFunction, transactions }: HttpTestSettings<T>): Promise<T> {

    const pendingPromise = requestFunction();

    for (const { request, response } of transactions) {

      while ((this.httpTestingController as any).open.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, this.requestPollinterval));
      }
      const req = this.httpTestingController.expectOne({
        method: request.methodOracle,
        url: request.urlOracle
      });
      if (request.bodyOracle !== undefined) {
        expect(req.request.body).toEqual(request.bodyOracle);
      }
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
