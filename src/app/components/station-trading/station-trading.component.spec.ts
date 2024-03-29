import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { IskprinterApiService } from 'src/app/services/iskprinter-api/iskprinter-api.service';
import { EnvironmentService } from 'src/app/services/environment/environment.service';

import { StationTradingComponent } from './station-trading.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Observable } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

describe('StationTradingComponent', () => {
  let component: StationTradingComponent;
  let fixture: ComponentFixture<StationTradingComponent>;

  let spyAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;
  let spyIskprinterApiService: jasmine.SpyObj<IskprinterApiService>;
  let spyEnvironmentService: jasmine.SpyObj<EnvironmentService>;

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      declarations: [
        StationTradingComponent,
        MatPaginator,
      ],
      imports: [
        BrowserAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTableModule,
        ReactiveFormsModule,
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: jasmine.createSpyObj('AuthenticatorService', ['withIskprinterReauth'])
        },
        {
          provide: IskprinterApiService,
          useValue: jasmine.createSpyObj('TradeRecommendationService', ['getRegions'])
        },
        {
          provide: EnvironmentService,
          useValue: jasmine.createSpyObj('EnvironmentService', ['getVariable'])
        },
      ]
    })
      .compileComponents();

    spyAuthenticatorService = TestBed.inject(AuthenticatorService) as jasmine.SpyObj<AuthenticatorService>;
    spyIskprinterApiService = TestBed.inject(IskprinterApiService) as jasmine.SpyObj<IskprinterApiService>;
    spyEnvironmentService = TestBed.inject(EnvironmentService) as jasmine.SpyObj<EnvironmentService>;

    spyAuthenticatorService.withIskprinterReauth.and.callFake(() => new Observable((subscriber) => {
      subscriber.next([] as unknown as any);
    }));
    spyIskprinterApiService.getRegions.and.callFake(() => new Observable((subscriber) => {
      subscriber.next([]);
    }));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StationTradingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
