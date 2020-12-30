import { TestBed,  } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';

import { EnvironmentService } from './environment.service';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let mockHttp: Partial<HttpClient>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: mockHttp
        }
      ]
    });
    service = TestBed.inject(EnvironmentService);
  });

  it('should read from the environment file by default', async () => {
    expect(service.isPackaged).toBeFalse();
    expect(await service.get('FRONTEND_URL')).toMatch(new RegExp('http://localhost:\\d+'));
    expect(await service.get('BACKEND_URL')).toBe('http://localhost:3000/api');
  });

  it('should attempt an http request to its own url when packaged as a docker image', async () => {
    service.isPackaged = true;
    mockHttp.get = (...args) => {
      toPromise: () => HttpResponse<Object>
    };
    expect(service.isPackaged).toBeFalse();
    expect(await service.get('FRONTEND_URL')).toMatch(new RegExp('http://localhost:\\d+'));
    expect(await service.get('BACKEND_URL')).toBe('http://localhost:3000/api');
  });


});
