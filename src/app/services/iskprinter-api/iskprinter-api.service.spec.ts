import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { IskprinterApiService } from './iskprinter-api.service';

describe('TradeRecommendationService', () => {
  let service: IskprinterApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
    });
    service = TestBed.inject(IskprinterApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
