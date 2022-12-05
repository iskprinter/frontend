import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { Observable } from 'rxjs';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Deal } from 'src/app/entities/DealFinder/Deal';
import { DealFinder } from 'src/app/entities/DealFinder/DealFinder';
import { RequestInformerService } from 'src/app/services/request-informer/request-informer.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import regions from 'src/assets/regions.json';
import { CharacterService } from 'src/app/services/character/character.service';

class Region {
  regionName: string;
  regionId: number;
}

@Component({
  selector: 'app-intrastation-deals',
  templateUrl: './intrastation-deals.component.html',
  styleUrls: ['./intrastation-deals.component.scss']
})
export class IntrastationDealsComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  _regions: Region[] = regions.sort((region1, region2) => region1.regionName.localeCompare(region2.regionName));

  deals: MatTableDataSource<Deal>;
  filteredRegions: Observable<Region[]>;
  regionControl = new UntypedFormControl('', Validators.required);
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
    public localStorage: LocalStorageService,
    private characterService: CharacterService,
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
    console.log('running...');
    const dealFinder = new DealFinder(
      this.authenticatorService,
      this.localStorage,
      this.characterService
    );
    const character = await this.characterService.getCharacterFromToken();
    const deals = await dealFinder.findDealsForCharacter(character);
    console.log(`Found ${deals.length} deals`);
    this.deals = new MatTableDataSource(deals);
    this.deals.paginator = this.paginator
    console.log('done.');
  }

}
