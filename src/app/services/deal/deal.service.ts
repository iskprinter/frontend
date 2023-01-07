import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Deal } from 'src/app/entities/Deal';

@Injectable({
  providedIn: 'root'
})
export class DealService {

  constructor(
    private http: HttpClient,
  ) { }

  getDeals(backendUrl: string, token: string): Observable<{ deals: Deal[] }> {
    return this.http.get<{ deals: Deal[] }>(`${backendUrl}/deals`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
      params: {
        characterId: 10,
        stationId: 5,
      }
    });
  }

}
