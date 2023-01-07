import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Region } from 'src/app/entities/Region';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { DealService } from 'src/app/services/deal/deal.service';
import { EnvironmentService } from 'src/app/services/environment/environment.service';

import { StationTradingComponent } from './station-trading.component';

describe('StationTradingComponent', () => {
  let component: StationTradingComponent;
  let fixture: ComponentFixture<StationTradingComponent>;

  let spyAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;
  let spyDealService: jasmine.SpyObj<DealService>;
  let spyEnvironmentService: jasmine.SpyObj<EnvironmentService>;

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      declarations: [StationTradingComponent],
      imports: [
        MatCardModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatTableModule
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: jasmine.createSpyObj('AuthenticatorService', ['eveRequest'])
        },
        {
          provide: DealService,
          useValue: jasmine.createSpyObj('DealService', ['getDeals'])
        },
        {
          provide: EnvironmentService,
          useValue: jasmine.createSpyObj('EnvironmentService', ['getVariable'])
        },
      ]
    })
      .compileComponents();

    spyAuthenticatorService = TestBed.inject(AuthenticatorService) as jasmine.SpyObj<AuthenticatorService>;
    spyDealService = TestBed.inject(DealService) as jasmine.SpyObj<DealService>;
    spyEnvironmentService = TestBed.inject(EnvironmentService) as jasmine.SpyObj<EnvironmentService>;

  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StationTradingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('region filtering', () => {

    let regions: Region[];

    beforeEach(() => {

      regions = [
        {
          regionName: 'A821-A',
          regionId: 10000019
        },
        {
          regionName: 'Aridia',
          regionId: 10000054
        },
        {
          regionName: 'Black Rise',
          regionId: 10000069
        },
      ];

    })

    it('ngOnInit should initialize the filteredRegions array peroprly when form field is empty', async () => {

      // Arrange
      component._regions = regions;
      const filteredRegions: Region[][] = [];

      // Act
      const promise = new Promise<void>((resolve, reject) =>
        component.filteredRegions.subscribe((regions) => {
          filteredRegions.push(regions);
          resolve();
        }));
      component.ngOnInit();
      await promise;

      // Assert
      expect(filteredRegions).toEqual([regions]);

    });

    it('ngOnInit should initialize the filteredRegions array peroprly when form field is NOT empty', async () => {

      // Arrange
      component._regions = regions;
      const filteredRegions: Region[][] = [];
      component.regionControl.setValue('Ari');

      // Act
      const promise = new Promise<void>((resolve, reject) =>
        component.filteredRegions.subscribe((regions) => {
          filteredRegions.push(regions);
          resolve();
        }));
      component.ngOnInit();
      await promise;

      // Assert
      expect(filteredRegions).toEqual([[{
        regionName: 'Aridia',
        regionId: 10000054
      }]]);

    });

    it('should filter regions properly', () => {

      // Arrange
      component._regions = regions;

      // Act
      const filteredRegions = component._filterRegions('Ari');

      // Assert
      expect(filteredRegions).toEqual([{
        regionName: 'Aridia',
        regionId: 10000054
      }]);

    });

  });

});
