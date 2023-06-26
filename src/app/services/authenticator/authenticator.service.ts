import { Buffer } from 'buffer/';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

import { EnvironmentService } from 'src/app/services/environment/environment.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { NoValidCredentialsError } from 'src/app/errors/NoValidCredentialsError';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticatorService  {
  constructor(
    private http: HttpClient,
    private router: Router,
    private environment: EnvironmentService,
    private localStorage: LocalStorageService,
  ) { }

  _refreshAccessToken(priorRefreshToken: string): Observable<string> {
    return new Observable((subscriber) => {

      this.environment.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (BACKEND_URL) => {

          const body = {
            proofType: 'refreshToken',
            proof: priorRefreshToken
          };
          this.http.post<{ accessToken: string, refreshToken: string }>(`${BACKEND_URL}/v0/tokens`, body).subscribe({
            next: ({ accessToken, refreshToken }) => {
              this._setAccessToken(accessToken);
              this._setRefreshToken(refreshToken);
              subscriber.next(accessToken);
            },
            error: (err) => {
              if ([401, 403].includes(err.status)) {
                this.logOut();
                subscriber.error(new NoValidCredentialsError())
              }
              subscriber.error(err)
            }
          });
        },
      });
    });
  }

  getLoginUrl(clientId: string): string {
    const responseType = 'code';
    const scopes = [
      'esi-assets.read_assets.v1',
      'esi-characterstats.read.v1',
      'esi-clones.read_clones.v1',
      'esi-location.read_location.v1',
      'esi-markets.read_character_orders.v1',
      'esi-markets.structure_markets.v1',
      'esi-skills.read_skills.v1',
      'esi-universe.read_structures.v1',
      'esi-wallet.read_character_wallet.v1'
    ];
    const state = uuidv4()
    const loginQueryParams = new URLSearchParams({
      response_type: responseType,
      redirect_uri: `${window.location.protocol}//${window.location.host}/code-receiver`,
      client_id: clientId,
      scope: scopes.join(' '),
      state,
    })
    const loginUrl = new URL(
      `/v2/oauth/authorize?${loginQueryParams.toString()}`,
      'https://login.eveonline.com/'
    );
    return loginUrl.toString();
  }

  getAccessToken(): string {
    const accessToken = this.localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new NoValidCredentialsError();
    }
    return accessToken;
  }

  getRefreshToken(): string {
    const refreshToken = this.localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new NoValidCredentialsError();
    }
    return refreshToken;
  }

  _setAccessToken(accessToken: string): void {
    this.localStorage.setItem('accessToken', accessToken);
  }

  _setRefreshToken(refreshToken: string): void {
    this.localStorage.setItem('refreshToken', refreshToken);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.isLoggedIn()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }

  isLoggedIn(): boolean {
    return !!this.localStorage.getItem('accessToken');
  }

  logOut() {
    this.environment.getVariable('BACKEND_URL').subscribe({
      next: (backendUrl) => {
        const accessToken = this.getAccessToken();
        this.http.delete(`${backendUrl}/v0/tokens`, {
          headers: { authorization: `Bearer ${accessToken}` }
        }).subscribe({
          next: () => {
            this.localStorage.removeItem('accessToken');
            this.localStorage.removeItem('refreshToken');
            this.router.navigate(['/login']);
          }
        });
      },
    });
  }

  getCharacterFromToken(): { characterId: number, characterName: string } {
    const accessToken = this.getAccessToken();
    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jwtPayload = JSON.parse(Buffer.from(base64, 'base64').toString());
    return {
      characterId: jwtPayload.characterId,
      characterName: jwtPayload.characterName,
    };
  }

  getTokensFromAuthorizationCode(authorizationCode: string): Observable<string> {
    return new Observable((subscriber) => {
      this.environment.getVariable('BACKEND_URL').subscribe({
        error: (err) => subscriber.error(err),
        next: (backendUrl) => {
          const body = {
            proofType: 'authorizationCode',
            proof: authorizationCode
          };
          this.http.post<{ accessToken: string, refreshToken: string }>(`${backendUrl}/v0/tokens`, body).subscribe({
            error: (err) => subscriber.error(err),
            next: ({ accessToken, refreshToken }) => {
              this._setAccessToken(accessToken);
              this._setRefreshToken(refreshToken);
              subscriber.next(accessToken);
            }
          });
        }
      })
    });
  }

  withIskprinterReauth<T>(doRequest: (accessToken: string) => Observable<T>): Observable<T> {
    return new Observable((subscriber) => {
      return doRequest(this.getAccessToken()).subscribe({
        complete: () => subscriber.complete(),
        error: (err) => {
          if (![401, 403].includes(err.status)) {
            return subscriber.error(err);
          }
          this._refreshAccessToken(this.getRefreshToken()).subscribe({
            error: (err) => subscriber.error(err),
            next: () => {
              doRequest(this.getAccessToken()).subscribe({
                complete: () => subscriber.complete(),
                next: (body) => subscriber.next(body),
                error: (err) => subscriber.error(err),
              });
            },
          });
        },
        next: (body) => subscriber.next(body),
      });
    });
  }
}
