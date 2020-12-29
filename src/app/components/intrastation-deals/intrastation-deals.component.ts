import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Character } from 'src/app/entities/Character';
import { Deal } from 'src/app/entities/DealFinder/Deal';
import { DealFinder } from 'src/app/entities/DealFinder/DealFinder';
import { RequestInformerService } from 'src/app/services/request-informer/request-informer.service';
import regions from 'src/assets/regions.json';

class Region {
  regionName: string;
  regionId: number;
}

@Component({
  selector: 'app-intrastation-deals',
  templateUrl: './intrastation-deals.component.html',
  styleUrls: ['./intrastation-deals.component.css']
})
export class IntrastationDealsComponent implements OnInit {

  @Input() character: Character;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  private readonly regions: Region[] = regions.sort((region1, region2) => region1.regionName.localeCompare(region2.regionName));

  deals: MatTableDataSource<Deal>;
  filteredRegions: Observable<Region[]>;
  regionControl = new FormControl(undefined, Validators.required);
  regionId: number;

  displayedDealColumns: string[] = [
    'typeId',
    'typeName',
    'volume',
    'buyPrice',
    'sellPrice',
    'fees',
    'profit',
  ];

  constructor(
    public authenticatorService: AuthenticatorService,
    public requestInformer: RequestInformerService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.filteredRegions = this.regionControl.valueChanges
      .pipe(
        startWith(''),
        map((regionName) => this._filterRegions(regionName))
      );
  }

  // Used in the view
  onRegionSelected(event) {
    this.regionId = event.option.id;
  }

  private _filterRegions(regionName: string): Region[] {
    const filterValue = regionName.toLowerCase();
    return this.regions.filter((r) => r.regionName.toLowerCase().includes(filterValue));
  }

  async printIsk() {
    console.log('running...');
    const dealFinder = new DealFinder(this.authenticatorService, window.localStorage);
    const deals = await dealFinder.findDeals(this.character);
    this.deals = new MatTableDataSource(deals);
    this.deals.paginator = this.paginator
    console.log('done.');
  }

}
