import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { Deal } from 'src/app/entities/Deal';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { IskprinterApiService } from 'src/app/services/iskprinter-api/iskprinter-api.service';
import { RequestInformerService } from 'src/app/services/request-informer/request-informer.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { Region } from 'src/app/entities/Region';
import { MatSelect } from '@angular/material/select';
import { System } from 'src/app/entities/System';
import { Station } from 'src/app/entities/Station';
import { Structure } from 'src/app/entities/Structure';
import { Observable } from 'rxjs';
import { Character } from 'src/app/entities/Character';

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
    'volume',
    'buyPrice',
    'sellPrice',
    'feesPerUnit',
    'profit',
  ];

  constructor(
    public authenticatorService: AuthenticatorService,
    public iskprinterApiService: IskprinterApiService,
    public requestInformer: RequestInformerService,
    public localStorage: LocalStorageService,
  ) { }

  ngOnInit() {
    this._getRegions().subscribe((regions) => {
      this.regions = regions.sort((r1, r2) => r1.name.localeCompare(r2.name))
    })
  }

  onRegionSelected(event: Event) {
    const regionId = this.regionSelect.value;
    return this._getSystems(regionId).subscribe((systems) => {
      this.systems = systems.sort((s1, s2) => s1.name.localeCompare(s2.name));
    });
  }

  async onSystemSelected(event: Event) {
    const systemId = this.systemSelect.value;
    this._getStations({ systemId }).subscribe((stations) => {
      this.stations = stations.sort((s1, s2) => s1.name.localeCompare(s2.name));
    });
    this._getStructures({ systemId }).subscribe((structures) => {
      this.structures = structures.sort((s1, s2) => s1.name.localeCompare(s2.name))
    });
  }

  onStationSelected(event: Event) {
    this.structureSelect.writeValue(undefined);
  }

  onStructureSelected(event: Event) {
    this.stationSelect.writeValue(undefined);
  }

  useCurrentLocation() {
    this.iskprinterApiService.getCharacters().subscribe((characters) => {
      const character = characters[0];
      if (character.location.station_id) {
        this.iskprinterApiService.getStation(character.location.station_id).subscribe((station) => {
          this.stations = [station];
          this.stationSelect.value = character.location.station_id;
        });
      }
      if (character.location.structure_id) {
        this.iskprinterApiService.getStructure(character.location.structure_id).subscribe((structure) => {
          this.structures = [structure];
          this.structureSelect.value = character.location.structure_id;
        })
      }
    });
  }

  async printIsk(): Promise<void> {
    const stationId = this.stationSelect.value;
    const structureId = this.structureSelect.value;
    if (!stationId && !structureId) {
      throw new Error('Location needs to be set.');
    }
    this.iskprinterApiService.getDeals({ stationId, structureId }).subscribe((deals) => {
      this.deals = new MatTableDataSource(deals.map((deal) => new Deal(deal.buyPrice, deal.feesPerUnit, deal.sellPrice, deal.typeName, deal.volume)));
      this.deals.paginator = this.paginator;
      this.deals.paginator.pageIndex = 1;
    });
  }

  _getRegions({ systemId }: { systemId?: number} = {}): Observable<Region[]> {
    return new Observable((subscriber) => {
      this.iskprinterApiService.getRegions({ systemId }).subscribe({
        next: (regions) => {
          subscriber.next(regions);
          subscriber.complete
        }
      });
    });
  }

  _getStation(stationId: number): Observable<Station> {
    return new Observable((subscriber) => {
      return this.iskprinterApiService.getStation(stationId).subscribe((station) => {
        subscriber.next(station);
        subscriber.complete();
      });
    });
  }

  _getStations({ systemId }: { systemId?: number } = {}): Observable<Station[]> {
    return new Observable((subscriber) => {
      return this.iskprinterApiService.getStations({ systemId }).subscribe((stations) => {
        subscriber.next(stations);
        subscriber.complete();
      });
    });
  }

  _getStructure(structureId: number): Observable<Structure> {
    return new Observable((subscriber) => {
      return this.iskprinterApiService.getStructure(structureId).subscribe((structure) => {
        subscriber.next(structure);
        subscriber.complete();
      });
    });
  }

  _getStructures({ systemId }: { systemId?: number } = {}): Observable<Structure[]> {
    return new Observable((subscriber) => {
      return this.iskprinterApiService.getStructures({ systemId }).subscribe((structures) => {
        subscriber.next(structures);
        subscriber.complete();
      });
    });
  }

  _getSystems(regionId: number): Observable<System[]> {
    return new Observable((subscriber) => {
      return this.iskprinterApiService.getSystems(regionId).subscribe((systems) => {
        subscriber.next(systems);
        subscriber.complete();
      });
    });
  }

}
