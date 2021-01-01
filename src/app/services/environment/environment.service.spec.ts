import { DOCUMENT } from '@angular/common';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EnvironmentService } from './environment.service';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let httpTestingController: HttpTestingController;
  let mockBackendUrl: string;
  const defaultMockDocument = {
    location: {
      protocol: 'some-protocol:',
      host: 'some-host:some-port'
    }
  };
  let mockDocument: any = defaultMockDocument;
  let mockFrontendUrl: string;

  const blockUntilRequestReceived = async (httpMock: any) => {
    const INTERVAL = 100; // ms
    while ((httpMock as any).open.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, INTERVAL));
    }
  }

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
    service = TestBed.inject(EnvironmentService);
    httpTestingController = TestBed.inject(HttpTestingController);
    mockBackendUrl = 'http://some-backend-url';
    mockDocument = defaultMockDocument;
    mockFrontendUrl = `${mockDocument.location.protocol}//${mockDocument.location.host}`
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have the appropriate FRONTEND_URL', async () => {
    expect(await service.getVariable('FRONTEND_URL')).toEqual(mockFrontendUrl);
  });

  it('should fetch the BACKEND_URL properly', async () => {

    // Arrange
    const variableToRequest = 'BACKEND_URL';
    const requestToMatch = `${mockFrontendUrl}/env/${variableToRequest}`;

    // Act
    const pendingRequest = service.getVariable(variableToRequest);
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestToMatch);
    req.flush(mockBackendUrl);
    const backendUrl = await pendingRequest;

    // Assert
    expect(req.request.method).toBe('GET');
    expect(backendUrl).toEqual(mockBackendUrl);

  });

});
