import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Character } from 'src/app/entities/Character';

import { Deal } from 'src/app/entities/Deal';
import { Region } from 'src/app/entities/Region';
import { Station } from 'src/app/entities/Station';
import { Structure } from 'src/app/entities/Structure';
import { System } from 'src/app/entities/System';
import { AuthenticatorService } from '../authenticator/authenticator.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({
  providedIn: 'root'
})
export class IskprinterApiService {
  constructor(
    private http: HttpClient,
    private authenticatorService: AuthenticatorService,
    private environmentService: EnvironmentService,
  ) { }

  getCharacters(): Observable<Character[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe((backendUrl) => {
        return this.authenticatorService._withReauthIfNecessary(() => {
          return this.http.get<{ characters: Character[] }>(
            `${backendUrl}/characters`,
            { headers: { authorization: `Bearer ${this.authenticatorService.getAccessToken()}` } },
          );
        }).subscribe({
          ...subscriber,
          next: (body) => subscriber.next(body.characters),
        });
      });
    });
  }

  getDeals({ stationId, structureId }: { stationId?: number, structureId?: number }): Observable<Deal[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe((backendUrl) => {

        const params: { stationId?: number, structureId?: number } = {};
        if (stationId) {
          params['station-id'] = stationId;
        }
        if (structureId) {
          params['structure-id'] = structureId;
        }
        return this.authenticatorService._withReauthIfNecessary(() => {
          return this.http.get<{ deals: Deal[] }>(
            `${backendUrl}/deals`,
            {
              headers: { authorization: `Bearer ${this.authenticatorService.getAccessToken()}` },
              params
            },
          );
        }).subscribe({
          ...subscriber,
          next: (body) => subscriber.next(body.deals),
        });
      });
    });
  }

  getRegions({ systemId }: { systemId?: number } = {}): Observable<Region[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe((backendUrl) => {
        return this.http.get<{ regions: Region[] }>(`${backendUrl}/regions`, {
          params: {
            ...(systemId && { 'system-id': systemId }),
          }
        }).subscribe({
          ...subscriber,
          next: (body) => subscriber.next(body.regions),
        });
      });
    });
  }

  getStation(stationId: number): Observable<Station> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe((backendUrl) => {
        return this.http.get<{ station: Station }>(`${backendUrl}/stations/${stationId}`)
          .subscribe({
            ...subscriber,
            next: (body) => subscriber.next(body.station),
          });
      });
    });
  }

  getStations({ systemId }: { systemId?: number } = {}): Observable<Station[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe((backendUrl) => {
        return this.http.get<{ stations: Station[] }>(`${backendUrl}/stations`, {
          params: {
            ...(systemId && { 'system-id': systemId }),
          }
        }).subscribe({
          ...subscriber,
          next: (body) => subscriber.next(body.stations),
        });
      });
    });
  }

  getStructure(structureId: number): Observable<Structure> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe((backendUrl) => {
        return this.authenticatorService._withReauthIfNecessary(() => {
          return this.http.get<{ structure: Structure }>(`${backendUrl}/structures/${structureId}`, {
            headers: { authorization: `Bearer ${this.authenticatorService.getAccessToken()}` }
          });
        }).subscribe({
          ...subscriber,
          next: (body) => subscriber.next(body.structure),
        });
      });
    });
  }

  getStructures({ systemId }: { systemId?: number } = {}): Observable<Structure[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe((backendUrl) => {
        return this.authenticatorService._withReauthIfNecessary(() => {
          return this.http.get<{ structures: Structure[] }>(`${backendUrl}/structures`, {
            headers: { authorization: `Bearer ${this.authenticatorService.getAccessToken()}` },
            params: {
              ...(systemId && { 'system-id': systemId }),
            }
          });
        }).subscribe({
          ...subscriber,
          next: (body) => subscriber.next(body.structures),
        });
      });
    });
  }

  getSystems(regionId?: number): Observable<System[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe((backendUrl) => {
        return this.http.get<{ systems: System[] }>(`${backendUrl}/systems`, { params: { 'region-id': regionId } })
          .subscribe({
            ...subscriber,
            next: (body) => subscriber.next(body.systems),
          });
      });
    });
  }
}
