import { HttpClient, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

import { AuthenticatorInterface } from './authenticator.interface';
import { EnvironmentService } from 'src/app/services/environment/environment.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { NoValidCredentialsError } from 'src/app/errors/NoValidCredentialsError';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticatorService implements AuthenticatorInterface, CanActivate {

  private retryCount = 3;

  constructor(
    private http: HttpClient,
    private router: Router,
    private environment: EnvironmentService,
    private localStorage: LocalStorageService,
  ) { }

  async _getAccessTokenFromPriorAccessToken(priorAccessToken: string): Promise<string> {
    const body = {
      proofType: 'priorAccessToken',
      proof: priorAccessToken
    };
    let response;
    try {
      const BACKEND_URL = await new Promise((resolve) => this.environment.getVariable('BACKEND_URL').subscribe(resolve));
      response = await this.http.post<string>(`${BACKEND_URL}/tokens`, body, { observe: 'response' }).toPromise();
    } catch (error) {
      if (error.status === 404) {
        this.logOut();
        throw new NoValidCredentialsError();
      }
      throw error;
    }
    const newAccessToken = response.body;
    this._setAccessToken(newAccessToken);
    return newAccessToken;
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

  _setAccessToken(accessToken: string): void {
    this.localStorage.setItem('accessToken', accessToken);
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

  async fetchLoginUrl(): Promise<string> {
    const [
      BACKEND_URL,
      FRONTEND_URL
    ] = await Promise.all([
      this.environment.getVariable('BACKEND_URL'),
      this.environment.getVariable('FRONTEND_URL')
    ])
    const params = { 'callback-url': `${FRONTEND_URL}/code-receiver` };
    const response = await this.http.get<string>(`${BACKEND_URL}/login-url`, { observe: 'response', params }).toPromise();
    return response.body;
  }

  logOut(): void {
    this.localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }

  eveRequest<R>(method: string, url: string, options?: any): Observable<R> {
    if (!this.isLoggedIn()) {
      this.logOut();
      throw new NoValidCredentialsError();
    }
    return this._withReauthIfNecessary(() => {
      for (let i = 0; i < this.retryCount; i += 1) {
        try {
          return this.http.request<R>(
            method,
            url,
            {
              body: options?.body,
              headers: new HttpHeaders({
                ...options?.headers,
                Authorization: `Bearer ${this.getAccessToken()}`,
              }),
              params: options?.params,
              responseType: 'json'
            }
          );
        } catch (error) {
          if (error instanceof HttpErrorResponse && error.status === 0) {
            // Likely error due to absent CORS header on response. Retry.
          } else {
            throw error;
          }
        }
      }
    });
  }

  async getAccessTokenFromAuthorizationCode(authorizationCode: string): Promise<string> {
    const body = {
      proofType: 'authorizationCode',
      proof: authorizationCode
    };
    const BACKEND_URL = await new Promise((resolve) => this.environment.getVariable('BACKEND_URL').subscribe(resolve));
    const response = await this.http.post<string>(`${BACKEND_URL}/tokens`, body, { observe: 'response' }).toPromise();

    const accessToken = response.body;
    this._setAccessToken(accessToken);
    return accessToken;
  }

  _withReauthIfNecessary<T>(doRequest: () => Observable<T>): Observable<T> {
    return new Observable((subscriber) => {
      return doRequest().subscribe({
        next: (body) => subscriber.next(body),
        error: (err) => {
          if (![401, 403].includes(err.status)) {
            subscriber.error(err);
            return;
          }
          this._getAccessTokenFromPriorAccessToken(this.getAccessToken())
            .then(
              () => doRequest().subscribe({
                next: (body) => subscriber.next(body),
                error: (err) => subscriber.error(err),
              }),
              (err) => {
                if (err instanceof NoValidCredentialsError) {
                  this.logOut();
                  return;
                }
                subscriber.error(err);
              }
            )
        }
      });
    });
  }
}
