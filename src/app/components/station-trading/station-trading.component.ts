import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';

import { Deal } from 'src/app/entities/Deal';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { EnvironmentService } from 'src/app/services/environment/environment.service';
import { DealService } from 'src/app/services/deal/deal.service';
import { RequestInformerService } from 'src/app/services/request-informer/request-informer.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import regions from 'src/assets/regions.json';

class Region {
  regionName: string;
  regionId: number;
}

@Component({
  selector: 'app-station-trading',
  templateUrl: './station-trading.component.html',
  styleUrls: ['./station-trading.component.scss']
})
export class StationTradingComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  _regions: Region[] = regions.sort((region1, region2) => region1.regionName.localeCompare(region2.regionName));

  deals: MatTableDataSource<Deal>;
  filteredRegions: Observable<Region[]>;
  regionControl = new UntypedFormControl('', Validators.required);
  regionId: number;

  displayedDealColumns: string[] = [
    // 'typeId',
    'typeName',
    // 'volume',
    // 'buyPrice',
    // 'sellPrice',
    // 'fees',
    // 'profit',
  ];

  constructor(
    public authenticatorService: AuthenticatorService,
    public dealService: DealService,
    public environmentService: EnvironmentService,
    public requestInformer: RequestInformerService,
    public localStorage: LocalStorageService,
  ) { }

  ngOnInit(): void {
    this.filteredRegions = this.regionControl.valueChanges
      .pipe(map((regionName) => this._filterRegions(regionName)));
    this.regionControl.updateValueAndValidity();
  }

  _filterRegions(regionName: string): Region[] {
    const filterValue = regionName.toLowerCase();
    return this._regions.filter((r) => r.regionName.toLowerCase().includes(filterValue));
  }

  async printIsk() {
    const backendUrl = await this.environmentService.getVariable('BACKEND_URL');
    const token = this.authenticatorService.getAccessToken();
    this.dealService.getDeals(backendUrl, token).subscribe((body) => this.deals = new MatTableDataSource(body.deals));
  }

}
