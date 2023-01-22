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
    const envVar = await service.getVariable('FRONTEND_URL').subscribe((frontendUrl => {
      // Assert
      expect(frontendUrl).toEqual(mockEnvironment.FRONTEND_URL);
    }));

  });

});
