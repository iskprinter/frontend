import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticatorInterface } from './authenticator.interface';
import { EnvironmentService } from 'src/app/services/environment/environment.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';
import { NoValidCredentialsError } from 'src/app/errors/NoValidCredentialsError';

@Injectable({ providedIn: 'root' })
export class AuthenticatorService implements AuthenticatorInterface {

  constructor(
    private http: HttpClient,
    private router: Router,
    private environment: EnvironmentService,
    private localStorage: LocalStorageService,
  ) { }

  isLoggedIn(): boolean {
    return !!this.localStorage.getItem('accessToken');
  }

  public async fetchLoginUrl(): Promise<string> {
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
    this.router.navigate(['']);
  }

  async getAccessTokenFromAuthorizationCode(authorizationCode: string): Promise<string> {
    const body = {
      proofType: 'authorizationCode',
      proof: authorizationCode
    };
    const BACKEND_URL = await this.environment.getVariable('BACKEND_URL');
    const response = await this.http.post<string>(`${BACKEND_URL}/tokens`, body, { observe: 'response' }).toPromise();

    const accessToken = response.body;
    this.setAccessToken(accessToken);
    return accessToken;
  }

  async getAccessTokenFromPriorAccessToken(priorAccessToken: string): Promise<string> {
    const body = {
      proofType: 'priorAccessToken',
      proof: priorAccessToken
    };
    let response;
    try {
      const backendUrl = await this.environment.getVariable('BACKEND_URL');
      response = await this.http.post<string>(`${backendUrl}/tokens`, body, { observe: 'response' }).toPromise();
    } catch (error) {
      if (error.status === 404) {
        this.logOut();
        return;
      }
      throw error;
    }
    const newAccessToken = response.body;
    this.setAccessToken(newAccessToken);
    return newAccessToken;
  }

  public async requestWithAuth(method: string, url: string, options?: any): Promise<HttpResponse<Object>> {

    if (!this.isLoggedIn()) {
      throw new NoValidCredentialsError();
    }

    const doRequest = async () => this.http.request(
      method,
      url,
      {
        body: options?.body,
        headers: new HttpHeaders({
          ...options?.headers,
          Authorization: `Bearer ${this.getAccessToken()}`,
        }),
        observe: 'response',
        params: options?.params,
        responseType: 'json'
      }
    ).toPromise();

    try {
      return await doRequest();
    } catch (error) {
      if (![401, 403].includes(error.status)) {
        console.error(JSON.stringify(error));
        throw error;
      }
    }
    await this.getAccessTokenFromPriorAccessToken(this.getAccessToken());
    return await doRequest();
  }

  getAccessToken(): string {
    const accessToken = this.localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token exists.');
    }
    return accessToken;
  }

  private setAccessToken(accessToken: string): void {
    if (!accessToken) {
      throw new Error("Access token does not exist.");
    }
    this.localStorage.setItem('accessToken', accessToken);
  }

  async backendRequest(method: string, uri: string, options?: any): Promise<HttpResponse<Object>> {
    const backendUrl = await this.environment.getVariable('BACKEND_URL');
    return this.http.request(
      method,
      `${backendUrl}${uri}`,
      {
        body: options?.body,
        headers: new HttpHeaders({
          ...options?.headers,
        }),
        observe: 'response',
        params: options?.params,
        responseType: 'json'
      }
    ).toPromise();
  }

}
