import { HttpRequest, HttpResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

type RequestFunction<T> = () => Promise<T>;

interface HttpTestSettings<T> {
  requestFunction: RequestFunction<T>;
  transactions: {
    request: {
      urlOracle: string,
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

interface HttpTestResult<T> {
  response: T;
  requests: HttpRequest<any>[];
};

export class HttpTester {

  requestPollinterval = 100; // ms

  constructor(
    private httpTestingController: HttpTestingController
  ) { }

  async test<T>({ requestFunction, transactions }: HttpTestSettings<T>): Promise<HttpTestResult<T>> {

    const pendingResponse = requestFunction();
    const requests = []

    for (const { request, response } of transactions) {

      while ((this.httpTestingController as any).open.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, this.requestPollinterval));
      }
      const httpTest = this.httpTestingController.expectOne({
        url: request.urlOracle
      });
      httpTest.flush(response.body, response.options);
      requests.push(httpTest.request);

    }

    const httpTestResults = {
      response: await pendingResponse,
      requests
    };

    return httpTestResults;

  };

};

export async function blockUntilRequestReceived(httpMock: HttpTestingController): Promise<void> {
  const INTERVAL = 100; // ms
  while ((httpMock as any).open.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, INTERVAL));
  }
};
