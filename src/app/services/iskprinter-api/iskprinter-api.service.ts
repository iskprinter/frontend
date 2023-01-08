import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Deal } from 'src/app/entities/Deal';
import { Region } from 'src/app/entities/Region';
import { System } from 'src/app/entities/System';

@Injectable({
  providedIn: 'root'
})
export class IskprinterApiService {
  constructor(private http: HttpClient) { }

  getDeals(backendUrl: string, token: string): Observable<{ deals: Deal[] }> {
    return this.http.get<{ deals: Deal[] }>(
      `${backendUrl}/deals`,
      { headers: { authorization: `Bearer ${token}` } }
    );
  }

  getRegions(backendUrl: string): Observable<{ regions: Region[] }> {
    return this.http.get<{ regions: Region[] }>(`${backendUrl}/regions`);
  }

  getSystems(backendUrl: string, regionId?: number): Observable<{ systems: System[] }> {
    return this.http.get<{ systems: System[] }>(`${backendUrl}/systems`, { params: { regionId } });
  }
}
