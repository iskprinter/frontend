import { TestBed } from '@angular/core/testing';

import { RequestInformerService } from './request-informer.service';

describe('RequestInformerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RequestInformerService = TestBed.get(RequestInformerService);
    expect(service).toBeTruthy();
  });
});
