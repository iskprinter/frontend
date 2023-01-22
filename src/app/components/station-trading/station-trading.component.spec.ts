import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { IskprinterApiService } from 'src/app/services/iskprinter-api/iskprinter-api.service';
import { EnvironmentService } from 'src/app/services/environment/environment.service';

import { StationTradingComponent } from './station-trading.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, Subscriber } from 'rxjs';

describe('StationTradingComponent', () => {
  let component: StationTradingComponent;
  let fixture: ComponentFixture<StationTradingComponent>;

  let spyAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;
  let spyIskprinterApiService: jasmine.SpyObj<IskprinterApiService>;
  let spyEnvironmentService: jasmine.SpyObj<EnvironmentService>;

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      declarations: [StationTradingComponent],
      imports: [
        BrowserAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTableModule
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: jasmine.createSpyObj('AuthenticatorService', ['eveRequest'])
        },
        {
          provide: IskprinterApiService,
          useValue: jasmine.createSpyObj('DealService', ['getRegions'])
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
