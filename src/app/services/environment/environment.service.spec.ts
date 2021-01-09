import { DOCUMENT } from '@angular/common';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EnvironmentService } from './environment.service';
import { blockUntilRequestReceived } from 'src/app/test/utils';

describe('EnvironmentService', () => {

  let httpTestingController: HttpTestingController;
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
    expect(await service.getVariable('FRONTEND_URL')).toEqual(mockEnvironment.FRONTEND_URL);
  });

  it('should fetch the BACKEND_URL properly', async () => {

    // Arrange
    const variableToRequest = 'BACKEND_URL';
    const requestToMatch = `${mockEnvironment.FRONTEND_URL}/env/${variableToRequest}`;

    // Act
    const pendingRequest = service.getVariable(variableToRequest);
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestToMatch);
    req.flush(mockEnvironment.BACKEND_URL);
    const envVar = await pendingRequest;

    // Assert
    expect(req.request.method).toBe('GET');
    expect(envVar).toEqual(mockEnvironment.BACKEND_URL);

  });

  it('should fail gracefully if the variable cannot be found', async () => {

    // Arrange
    const variableToRequest = 'NONEXISTENT_VAR';
    const requestToMatch = `${mockEnvironment.FRONTEND_URL}/env/${variableToRequest}`;

    // Act
    const pendingRequest = service.getVariable(variableToRequest);
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestToMatch);
    req.flush(
      '<html>\n<head><title>404 Not Found</title></head>\n<body>\n<center><h1>404 Not Found</h1></center>\n<hr><center>openresty/1.19.3.1</center>\n</body>\n</html>',
      {
        status: 404,
        statusText: 'Not Found'
      }
    );
    const envVar = await pendingRequest;

    // Assert
    expect(req.request.method).toBe('GET');
    expect(envVar).toEqual(undefined);

  });

  it('should return the cached value if possible', async () => {

    // Arrange
    const variableToRequest = 'BACKEND_URL';
    const requestToMatch = `${mockEnvironment.FRONTEND_URL}/env/${variableToRequest}`;

    // Act
    const pendingRequest = service.getVariable(variableToRequest);
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestToMatch);
    req.flush(mockEnvironment.BACKEND_URL);
    const envVar = await pendingRequest;
    httpTestingController.verify();

    const envVar2 = await service.getVariable(variableToRequest); // second request

    // Assert
    expect(req.request.method).toBe('GET');
    expect(envVar2).toEqual(mockEnvironment.BACKEND_URL);

  });

});
