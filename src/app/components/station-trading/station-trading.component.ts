import { Component, OnInit, ViewChild } from '@angular/core';
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
import { Station } from 'src/app/entities/Station';
import { Structure } from 'src/app/entities/Structure';

@Component({
  selector: 'app-station-trading',
  templateUrl: './station-trading.component.html',
  styleUrls: ['./station-trading.component.scss']
})
export class StationTradingComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('regionSelect') regionSelect: MatSelect;
  @ViewChild('systemSelect') systemSelect: MatSelect;
  @ViewChild('stationSelect') stationSelect: MatSelect;
  @ViewChild('structureSelect') structureSelect: MatSelect;

  deals: MatTableDataSource<Deal>;
  regions: Region[];
  systems: System[];
  stations: Station[];
  structures: Structure[];

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
      this.systems = body.systems.sort((s1, s2) => s1.name.localeCompare(s2.name));
    });
  }

  async onSystemSelected(event: Event): Promise<void> {
    const backendUrl = await this.environmentService.getVariable('BACKEND_URL');
    const token = this.authenticatorService.getAccessToken();
    const systemId = this.systemSelect.value;
    this.iskprinterApiService.getStations(backendUrl, systemId).subscribe((body) => {
      this.stations = body.stations.sort((s1, s2) => s1.name.localeCompare(s2.name));
    });
    this.iskprinterApiService.getStructures(backendUrl, token, systemId).subscribe((body) => {
      this.structures = body.structures.sort((s1, s2) => s1.name.localeCompare(s2.name))
    });
  }

  async onStationSelected(event: Event): Promise<void> {
    this.structureSelect.writeValue(undefined);
  }

  async onStructureSelected(event: Event): Promise<void> {
    this.stationSelect.writeValue(undefined);
  }

  async useCurrentLocation(): Promise<void> {
    // TODO
  }

  async printIsk(): Promise<void> {
    const backendUrl = await this.environmentService.getVariable('BACKEND_URL');
    const token = this.authenticatorService.getAccessToken();
    const stationId = this.stationSelect.value;
    const structureId = this.structureSelect.value;
    if (!stationId && !structureId) {
      throw new Error('Location needs to be set.');
    }
    this.iskprinterApiService.getDeals(backendUrl, token, { stationId, structureId }).subscribe((body) => {
      this.deals = new MatTableDataSource(body.deals);
      this.deals.paginator = this.paginator;
    });
  }

}
