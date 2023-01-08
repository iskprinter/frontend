import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Deal } from 'src/app/entities/Deal';
import { Region } from 'src/app/entities/Region';
import { Station } from 'src/app/entities/Station';
import { Structure } from 'src/app/entities/Structure';
import { System } from 'src/app/entities/System';

@Injectable({
  providedIn: 'root'
})
export class IskprinterApiService {
  constructor(private http: HttpClient) { }

  getDeals(backendUrl: string, token: string, { stationId, structureId }: { stationId?: number, structureId?: number }): Observable<{ deals: Deal[] }> {
    const params: { stationId?: number, structureId?: number } = {};
    if (stationId) {
      params.stationId = stationId;
    }
    if (structureId) {
      params.structureId = structureId;
    }
    return this.http.get<{ deals: Deal[] }>(
      `${backendUrl}/deals`,
      { 
        headers: { authorization: `Bearer ${token}` },
        params
      },
    );
  }

  getRegions(backendUrl: string): Observable<{ regions: Region[] }> {
    return this.http.get<{ regions: Region[] }>(`${backendUrl}/regions`);
  }

  getStations(backendUrl: string, systemId?: number): Observable<{ stations: Station[] }> {
    return this.http.get<{ stations: Station[] }>(`${backendUrl}/stations`, { params: { systemId } });
  }

  getStructures(backendUrl: string, token: string, systemId?: number): Observable<{ structures: Structure[] }> {
    return this.http.get<{ structures: Structure[] }>(`${backendUrl}/structures`, {
      headers: { authorization: `Bearer ${token}` },
      params: { systemId }
    });
  }

  getSystems(backendUrl: string, regionId?: number): Observable<{ systems: System[] }> {
    return this.http.get<{ systems: System[] }>(`${backendUrl}/systems`, { params: { regionId } });
  }
}
