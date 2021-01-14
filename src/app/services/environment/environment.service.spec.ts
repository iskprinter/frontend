import { DOCUMENT } from '@angular/common';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EnvironmentService } from './environment.service';
import { HttpTester } from 'src/app/test/HttpTester';

describe('EnvironmentService', () => {

  let httpTestingController: HttpTestingController;
  let httpTester: HttpTester;
  const defaultMockDocument = {
    location: {
      protocol: 'some-protocol:',
      host: 'some-host:some-port'
    }
  };
  let mockDocument: any = defaultMockDocument;
  let defaultMockBackendUrl = 'http://some-backend-url';
  let defaultMockFrontendUrl = `${mockDocument.location.protocol}//${mockDocument.location.host}`;
  const mockEnvironment = {
    BACKEND_URL: defaultMockBackendUrl,
    FRONTEND_URL: defaultMockFrontendUrl
  };
  let service: EnvironmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EnvironmentService,
        {
          provide: DOCUMENT,
          useValue: mockDocument
        }
      ]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    httpTester = new HttpTester(httpTestingController);
    mockEnvironment.BACKEND_URL = defaultMockBackendUrl;
    mockEnvironment.FRONTEND_URL = defaultMockFrontendUrl;
    mockDocument = defaultMockDocument;
    service = TestBed.inject(EnvironmentService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have the appropriate FRONTEND_URL', async () => {

    // Act
    const envVar = await service.getVariable('FRONTEND_URL')

    // Assert
    expect(envVar).toEqual(mockEnvironment.FRONTEND_URL);

  });

  it('should fetch the BACKEND_URL properly', async () => {

    // Arrange
    const variableToRequest = 'BACKEND_URL';
    const requestToMatch = `${mockEnvironment.FRONTEND_URL}/env/${variableToRequest}`;
    const httpTestSettings = {
      requestFunction: () => service.getVariable(variableToRequest),
      responses: [
        {
          body: mockEnvironment.BACKEND_URL,
        }
      ]
    };

    // Act
    const httpTestResults = await httpTester.test<string>(httpTestSettings);

    // Assert
    expect(httpTestResults.requests[0].method).toBe('GET');
    expect(httpTestResults.requests[0].url).toBe(requestToMatch);
    await expectAsync(httpTestResults.response()).toBeResolvedTo(mockEnvironment.BACKEND_URL);

  });

  it('should fail gracefully if the variable cannot be found', async () => {

    // Arrange
    const variableToRequest = 'NONEXISTENT_VAR';
    const requestToMatch = `${mockEnvironment.FRONTEND_URL}/env/${variableToRequest}`;
    const httpTestSettings = {
      requestFunction: () => service.getVariable(variableToRequest),
      responses: [
        {
          body: '<html>\n<head><title>404 Not Found</title></head>\n<body>\n<center><h1>404 Not Found</h1></center>\n<hr><center>openresty/1.19.3.1</center>\n</body>\n</html>',
          options: {
            status: 404,
            statusText: 'Not Found'
          }
        }
      ]
    };

    // Act
    const httpTestResults = await httpTester.test<string>(httpTestSettings);

    // Assert
    expect(httpTestResults.requests[0].method).toBe('GET');
    expect(httpTestResults.requests[0].url).toBe(requestToMatch);
    await expectAsync(httpTestResults.response()).toBeResolvedTo(undefined);

  });

  it('should return the cached value if possible', async () => {

    // Arrange
    const variableToRequest = 'BACKEND_URL';
    const requestToMatch = `${mockEnvironment.FRONTEND_URL}/env/${variableToRequest}`;
    const httpTestSettings = {
      requestFunction: () => service.getVariable(variableToRequest),
      responses: [
        {
          body: mockEnvironment.BACKEND_URL,
        } // Only one response defined
      ]
    };

    // Act
    const httpTestResult = await httpTester.test<string>(httpTestSettings); // First request
    const backendUrl = await service.getVariable(variableToRequest); // Second request should not need HTTP response

    // Assert
    expect(httpTestResult.requests[0].url).toBe(requestToMatch);
    expect(backendUrl).toEqual(mockEnvironment.BACKEND_URL);

  });

});
