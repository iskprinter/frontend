import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { Deal } from 'src/app/entities/Deal';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { EnvironmentService } from 'src/app/services/environment/environment.service';
import { IskprinterApiService } from 'src/app/services/iskprinter-api/iskprinter-api.service';
import { RequestInformerService } from 'src/app/services/request-informer/request-informer.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { Region } from 'src/app/entities/Region';
import { MatSelect } from '@angular/material/select';
import { System } from 'src/app/entities/System';

@Component({
  selector: 'app-station-trading',
  templateUrl: './station-trading.component.html',
  styleUrls: ['./station-trading.component.scss']
})
export class StationTradingComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('regionSelect') regionSelect: MatSelect;
  @ViewChild('systemSelect') systemSelect: MatSelect;

  deals: MatTableDataSource<Deal>;
  regions: Region[];
  systems: System[];

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
    public environmentService: EnvironmentService,
    public iskprinterApiService: IskprinterApiService,
    public requestInformer: RequestInformerService,
    public localStorage: LocalStorageService,
  ) { }

  async ngOnInit(): Promise<void> {
    const backendUrl = await this.environmentService.getVariable('BACKEND_URL');
    this.iskprinterApiService.getRegions(backendUrl).subscribe({
      next: (body) => this.regions = body.regions.sort((r1, r2) => r1.name.localeCompare(r2.name))
    });
  }

  async onRegionSelected(event: Event): Promise<void> {
    const backendUrl = await this.environmentService.getVariable('BACKEND_URL');
    const regionId = this.regionSelect.value;
    this.iskprinterApiService.getSystems(backendUrl, regionId).subscribe((body) => {
      this.systems = body.systems;
    });
  }

  async onSystemSelected(event: Event): Promise<void> {
    // TODO
  }

  async printIsk(): Promise<void> {
    const backendUrl = await this.environmentService.getVariable('BACKEND_URL');
    const token = this.authenticatorService.getAccessToken();
    this.iskprinterApiService.getDeals(backendUrl, token).subscribe((body) => {
      this.deals = new MatTableDataSource(body.deals);
      this.deals.paginator = this.paginator;
    });
  }

}
