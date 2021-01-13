import { HttpRequest } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

type RequestFunction<T> = () => Promise<T>;

interface HttpTestSettings<T> {
  requestFunction: RequestFunction<T>;
  transactions: {
    request?: {
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
  requests: (HttpRequest<any> & { url: string })[];
};

interface HttpTestResult2<T> {
  response: () => Promise<T>;
  requests: (HttpRequest<any> & { url: string })[];
};

export class HttpTester {

  requestPollinterval = 100; // ms

  constructor(
    private httpTestingController: HttpTestingController
  ) { }

  async test<T>({ requestFunction, transactions }: HttpTestSettings<T>): Promise<HttpTestResult<T>> {

    let data;
    const pendingResponse = requestFunction()
      .then((d) => data = d)
      .catch((e) => { throw e; });

    const requests = []

    for (const { request, response } of transactions) {

      while ((this.httpTestingController as any).open.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, this.requestPollinterval));
      }
      const requestedUrl = (this.httpTestingController as any).open[0];
      const httpTest = this.httpTestingController.expectOne(requestedUrl);
      requests.push({
        url: requestedUrl,
        ...httpTest.request,
      });
      httpTest.flush(response.body, response.options);

    }

    await pendingResponse;
    const httpTestResults = {
      response: data,
      requests
    };

    return httpTestResults;

  };

  async test2<T>({ requestFunction, transactions }: HttpTestSettings<T>): Promise<HttpTestResult2<T>> {

    let data: any;
    let error: Error;
    let done: boolean = false;

    const requests = []

    // Start the server listening for requests
    const server = (async () => {
      for (const { request, response } of transactions) {

        while ((this.httpTestingController as any).open.length === 0) {

          // If the client has thrown an error, then stop waiting for additional requests to arrive.
          if (done) { break; }

          // Otherwise, wait a bit for a new request to arrive.
          await new Promise((resolve) => setTimeout(resolve, this.requestPollinterval));

        }
        const requestedUrl = (this.httpTestingController as any).open[0];
        const httpTest = this.httpTestingController.expectOne(requestedUrl);
        requests.push({
          url: requestedUrl,
          ...httpTest.request,
        });
        httpTest.flush(response.body, response.options);

      }
    })();

    try {
      data = await requestFunction()
    } catch (e) {
      error = e;
    } finally {
      done = true;
    }

    // Wait for the server to stop.
    await server;

    // Collect the test results
    const httpTestResults = {
      response: () => (error ? Promise.reject(error) : Promise.resolve(data)),
      requests
    };

    return httpTestResults;

  };

};
