import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { EnvironmentService } from './environment.service';
import { HttpParams } from '@angular/common/http';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EnvironmentService]
    });
    service = TestBed.inject(EnvironmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have the appropriate FRONTEND_URL', async () => {
    expect(await service.getVariable('FRONTEND_URL')).toMatch(new RegExp('http://localhost:\\d+'));
  });

  it('should have the appropriate BACKEND_URL', async () => {

    const variableToRequest = 'BACKEND_URL';
    const dummyBackendUrl = 'http://localhost:80/api';
    const requestToMatch = `http://localhost:9876/env/${variableToRequest}`;

    const pendingRequest = service.getVariable(variableToRequest);

    const INTERVAL = 100; // ms
    while ((httpMock as any).open.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, INTERVAL));
    }

    const req = httpMock.expectOne(requestToMatch);
    expect(req.request.method).toBe('GET');
    req.flush(dummyBackendUrl);

    const backendUrl = await pendingRequest;
    expect(backendUrl).toEqual(dummyBackendUrl);

  });

});
