import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Character } from 'src/app/entities/Character';
import { Constellation } from 'src/app/entities/Constellation';

import { RecommendedTrade } from 'src/app/entities/RecommendedTrade';
import { Region } from 'src/app/entities/Region';
import { Station } from 'src/app/entities/Station';
import { Structure } from 'src/app/entities/Structure';
import { System } from 'src/app/entities/System';
import { EnvironmentService } from '../environment/environment.service';
import { Order } from 'src/app/entities/Order';
import { Trade } from 'src/app/entities/Trade';

@Injectable({
  providedIn: 'root'
})
export class IskprinterApiService {
  constructor(
    private http: HttpClient,
    private environmentService: EnvironmentService,
  ) { }

  createRecommendedTrade(accessToken: string, { stationId, structureId }: { stationId?: number, structureId?: number }): Observable<RecommendedTrade> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.post<{ recommendedTrade: RecommendedTrade }>(
            `${backendUrl}/v0/recommended-trades`,
            {
              ...(stationId && { stationId }),
              ...(structureId && { structureId }),
            },
            { headers: { authorization: `Bearer ${accessToken}` } },
          ).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.recommendedTrade),
          });
        }
      });
    });
  }

  getCharacters(accessToken: string): Observable<Character[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ characters: Character[] }>(
            `${backendUrl}/v0/characters`,
            { headers: { authorization: `Bearer ${accessToken}` } },
          ).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.characters),
          });
        }
      });
    });
  }

  getCharacterOrders(accessToken: string): Observable<Order[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ orders: Order[] }>(
            `${backendUrl}/v0/orders`,
            { headers: { authorization: `Bearer ${accessToken}` } },
          ).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.orders),
          });
        }
      });
    });
  }

  getCharacterPortrait(characterId: number): Observable<{ portraitUrl: string }> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ portraitUrl: string }>(
            `${backendUrl}/v0/characters/${characterId}/portrait`,
            // { headers: { authorization: `Bearer ${this.authenticatorService.getAccessToken()}` } },
          ).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body),
          });
        }
      });
    });
  }

  getCharacterTrades(accessToken: string, characterId: number): Observable<Trade[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ trades: Trade[] }>(
            `${backendUrl}/v0/characters/${characterId}/trades`,
            { headers: { authorization: `Bearer ${accessToken}` } },
          ).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.trades),
          });
        }
      });
    });
  }

  getConstellations({ regionId }: { regionId?: number }): Observable<Constellation[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ constellations: Constellation[] }>(
            `${backendUrl}/v0/constellations`,
            {
              ...(regionId && { params: { 'region-id': regionId } })
            },
          ).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.constellations),
          });
        }
      });
    });
  }

  getRecommendedTrade(accessToken: string, recommendedTradeId: string): Observable<RecommendedTrade> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ recommendedTrade: RecommendedTrade }>(
            `${backendUrl}/v0/recommended-trades/${recommendedTradeId}`,
            { headers: { authorization: `Bearer ${accessToken}` } },
          ).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.recommendedTrade),
          });
        }
      });
    });
  }

  getRecommendedTrades(accessToken: string): Observable<RecommendedTrade[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ recommendedTrades: RecommendedTrade[] }>(
            `${backendUrl}/v0/recommended-trades`,
            { headers: { authorization: `Bearer ${accessToken}` } },
          ).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.recommendedTrades),
          });
        }
      });
    });
  }

  getRegions({ systemId }: { systemId?: number } = {}): Observable<Region[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ regions: Region[] }>(`${backendUrl}/v0/regions`, {
            params: {
              ...(systemId && { 'system-id': systemId }),
            }
          }).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.regions),
          });
        }
      });
    });
  }

  getStation(stationId: number): Observable<Station> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ station: Station }>(`${backendUrl}/v0/stations/${stationId}`).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.station),
          });
        }
      });
    });
  }

  getStations({ systemId }: { systemId?: number } = {}): Observable<Station[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ stations: Station[] }>(`${backendUrl}/v0/stations`, {
            params: {
              ...(systemId && { 'system-id': systemId }),
            }
          }).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.stations),
          });
        }
      });
    });
  }

  getStructure(accessToken: string, structureId: number): Observable<Structure> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ structure: Structure }>(`${backendUrl}/v0/structures/${structureId}`, {
            headers: { authorization: `Bearer ${accessToken}` }
          }).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.structure),
          });
        }
      });
    });
  }

  getStructures(accessToken: string, { systemId }: { systemId?: number } = {}): Observable<Structure[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ structures: Structure[] }>(`${backendUrl}/v0/structures`, {
            headers: { authorization: `Bearer ${accessToken}` },
            params: {
              ...(systemId && { 'system-id': systemId }),
            }
          }).subscribe({
            complete: () => subscriber.complete(),
            error: (err) => subscriber.error(err),
            next: (body) => subscriber.next(body.structures),
          });
        }
      })
    });
  }

  getSystems(regionId?: number): Observable<System[]> {
    return new Observable((subscriber) => {
      return this.environmentService.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          return this.http.get<{ systems: System[] }>(`${backendUrl}/v0/systems`, { params: { 'region-id': regionId } })
            .subscribe({
              complete: () => subscriber.complete(),
              error: (err) => subscriber.error(err),
              next: (body) => subscriber.next(body.systems),
            });
        }
      });
    });
  }
}
