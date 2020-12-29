import { TestBed } from '@angular/core/testing';

import { RequestThrottler } from './request-throttler';

describe('RequestThrottler', () => {
  let module: RequestThrottler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RequestThrottler
      ]
    });
    module = TestBed.inject(RequestThrottler);
  });

  it('should be created', () => {
    expect(module).toBeTruthy();
  });
});
