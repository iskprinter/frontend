import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { Deal } from 'src/app/entities/Deal';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { IskprinterApiService } from 'src/app/services/iskprinter-api/iskprinter-api.service';
import { RequestInformerService } from 'src/app/services/request-informer/request-informer.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { Region } from 'src/app/entities/Region';
import { System } from 'src/app/entities/System';
import { Station } from 'src/app/entities/Station';
import { Structure } from 'src/app/entities/Structure';
import { Observable } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { Trade } from 'src/app/entities/Trade';
import { Character } from 'src/app/entities/Character';

@Component({
  selector: 'app-station-trading',
  templateUrl: './station-trading.component.html',
  styleUrls: ['./station-trading.component.scss']
})
export class StationTradingComponent implements OnInit {

  stationTradingForm: FormGroup;
  regionSelect: FormControl;
  systemSelect: FormControl;
  stationSelect: FormControl;
  structureSelect: FormControl;

  @ViewChild('dealPaginator') dealPaginator: MatPaginator;
  @ViewChild('orderPaginator') orderPaginator: MatPaginator;

  deals: MatTableDataSource<Deal>;
  trades: MatTableDataSource<Trade>;

  regions: Region[];
  systems: System[];
  stations: Station[];
  structures: Structure[];

  displayedDealColumns: string[] = [
    // 'typeId',
    'typeName',
    'volume',
    'buyPrice',
    'sellPrice',
    'feesPerUnit',
    'profit',
  ];
  displayedTradeColumns: string[] = [
    'typeName',
    'buyVolume',
    'averageBuyPrice',
    'sellVolume',
    'averageSellPrice',
    'profit',
  ];

  constructor(
    public authenticatorService: AuthenticatorService,
    public iskprinterApiService: IskprinterApiService,
    public requestInformer: RequestInformerService,
    public localStorage: LocalStorageService,
  ) { }

  ngOnInit() {
    this.regionSelect = new FormControl();
    this.systemSelect = new FormControl();
    this.stationSelect = new FormControl();
    this.structureSelect = new FormControl();
    this.regionSelect.disable()
    this.systemSelect.disable()
    this.stationSelect.disable()
    this.structureSelect.disable()
    this.stationTradingForm = new FormGroup({
      regionSelect: this.regionSelect,
      systemSelect: this.systemSelect,
      stationSelect: this.stationSelect,
      structureSelect: this.structureSelect,
    });
    this._getRegions().subscribe({
      next: (regions) => this.regions = regions.sort((r1, r2) => r1.name.localeCompare(r2.name)),
      complete: () => this.regionSelect.enable(),
    });
  }

  onRegionSelected(event: Event) {
    const regionId = this.regionSelect.value;
    return this._getSystems(regionId).subscribe({
      next: (systems) => {
        this.systems = systems.sort((s1, s2) => s1.name.localeCompare(s2.name));
      },
      complete: () => this.systemSelect.enable(),
    });
  }

  async onSystemSelected(event: Event) {
    const systemId = this.systemSelect.value;
    this._getStations({ systemId }).subscribe({
      next: (stations) => {
        this.stations = stations.sort((s1, s2) => s1.name.localeCompare(s2.name));
      },
      complete: () => this.stationSelect.enable(),
    });
    this._getStructures({ systemId }).subscribe({
      next: (structures) => {
        this.structures = structures.sort((s1, s2) => s1.name.localeCompare(s2.name));
      },
      complete: () => this.structureSelect.enable(),
    });
  }

  onStationSelected(event: Event) {
    this.structureSelect.setValue(undefined);
  }

  onStructureSelected(event: Event) {
    this.stationSelect.setValue(undefined);
  }

  useCurrentLocation() {
    return this._getCharacters().subscribe((characters) => {
      const character = characters[0];
      if (character.location.station_id) {
        this._getStation(character.location.station_id).subscribe({
          next: (station) => {
            this.stations = [station];
            this.stationSelect.setValue(character.location.station_id)
          }
        });
      }
      if (character.location.structure_id) {
        this.authenticatorService.withIskprinterReauth((accessToken) => {
          return this.iskprinterApiService.getStructure(accessToken, character.location.structure_id);
        }).subscribe((structure) => {
          this.structures = [structure];
          this.structureSelect.setValue(character.location.structure_id);
        });
      }
    });
  }

  async printIsk(): Promise<void> {
    const stationId = this.stationSelect.value;
    const structureId = this.structureSelect.value;
    if (!stationId && !structureId) {
      throw new Error('Location needs to be set.');
    }
    this._getDeals({ stationId, structureId }).subscribe({
      next: (deals) => {
        this.deals = new MatTableDataSource(deals.map((deal) => new Deal(deal.buyPrice, deal.feesPerUnit, deal.sellPrice, deal.typeName, deal.volume)));
        this.deals.paginator = this.dealPaginator;
        this.deals.paginator.pageIndex = 1;
      }
    });

    // Get past trades
    // const characterId = this.authenticatorService.getCharacterFromToken().characterId;
    // this.authenticatorService.withIskprinterReauth((accessToken) => {
    //   return this.iskprinterApiService.getCharacterTrades(accessToken, characterId);
    // }).subscribe({
    //   next: (trades) => this.trades = new MatTableDataSource(trades.sort((t1, t2) => {
    //     const t1Profit = (t1.sellVolume * t1.averageSellPrice - t1.buyVolume * t1.averageBuyPrice);
    //     const t2Profit = (t2.sellVolume * t2.averageSellPrice - t2.buyVolume * t2.averageBuyPrice);
    //     return t2Profit - t1Profit;
    //   }))
    // });
  }

  _getCharacters(): Observable<Character[]> {
    return this.authenticatorService.withIskprinterReauth((accessToken) => {
      return this.iskprinterApiService.getCharacters(accessToken);
    });
  }

  _getDeals({ stationId, structureId }: { stationId?: number, structureId?: number }): Observable<Deal[]> {
    return this.authenticatorService.withIskprinterReauth((accessToken) => {
      return this.iskprinterApiService.getDeals(accessToken, { stationId, structureId });
    });
  }

  _getRegions({ systemId }: { systemId?: number } = {}): Observable<Region[]> {
    return this.iskprinterApiService.getRegions({ systemId });
  }

  _getStation(stationId: number): Observable<Station> {
    return this.iskprinterApiService.getStation(stationId);
  }

  _getStations({ systemId }: { systemId?: number } = {}): Observable<Station[]> {
    return this.iskprinterApiService.getStations({ systemId });
  }

  _getStructure(structureId: number): Observable<Structure> {
    return this.authenticatorService.withIskprinterReauth((accessToken) => {
      return this.iskprinterApiService.getStructure(accessToken, structureId);
    });
  }

  _getStructures({ systemId }: { systemId?: number } = {}): Observable<Structure[]> {
    return this.authenticatorService.withIskprinterReauth((accessToken) => {
      return this.iskprinterApiService.getStructures(accessToken, { systemId });
    });
  }

  _getSystems(regionId: number): Observable<System[]> {
    return this.iskprinterApiService.getSystems(regionId);
  }

}
