import { HttpRequest } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestRequest } from '@angular/common/http/testing';

type RequestFunction<T> = () => Promise<T>;

export interface HttpTestSettings<T> {
  requestFunction: RequestFunction<T>;
  responses: {
    body: any,
    options?: {
      status: number,
      statusText: string
    }
  }[];
}

interface TestHttpRequest<T> extends HttpRequest<T> {
  url: string;
}

interface HttpTestResult<T> {
  response: () => Promise<T>;
  requests: TestHttpRequest<any>[];
}

export class HttpTester {

  requestPollinterval = 100; // ms

  constructor(
    private httpTestingController: HttpTestingController
  ) { }

  async test<T>({ requestFunction, responses }: HttpTestSettings<T>): Promise<HttpTestResult<T>> {


    // Collect the test results
    const httpTestResults: HttpTestResult<T> = {
      response: undefined,
      requests: []
    };

    let done = false;

    // Start the server listening for requests
    const server = (async () => {
      for (const response of responses) {

        while ((this.httpTestingController as any).open.length === 0) {

          // If the client has thrown an error, then stop waiting for additional requests to arrive.
          if (done) { return; }

          // Otherwise, wait a bit for a new request to arrive.
          await new Promise((resolve) => setTimeout(resolve, this.requestPollinterval));

        }

        const testRequest: TestRequest = (this.httpTestingController as any).open[0];
        const requestedUrl = testRequest.request.url;
        const httpTest = this.httpTestingController.expectOne(testRequest.request.urlWithParams);

        const testHttpRequest: TestHttpRequest<T> = httpTest.request;
        testHttpRequest.url = requestedUrl;
        httpTestResults.requests.push(testHttpRequest);

        httpTest.flush(response.body, response.options);

      }
    })();

    try {
      const data = await requestFunction()
      httpTestResults.response = () => Promise.resolve(data);
    } catch (error) {
      httpTestResults.response = () => Promise.reject(error);
    } finally {
      done = true;
    }

    // Wait for the server to stop.
    await server;

    return httpTestResults;

  };

};
