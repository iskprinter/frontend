import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticatorInterface } from './authenticator.interface';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthenticatorService implements AuthenticatorInterface {

  private accessToken: string;
  private frontendUrl: string;
  private backendUrl: string;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.accessToken = window.localStorage.getItem('accessToken');
    this.frontendUrl = `${window.location.protocol}//${window.location.host}`;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  public async fetchLoginUrl(): Promise<string> {
    const backendUrl = await this.getBackendUrl();
    const params = { 'callback-url': `${this.frontendUrl}/code-receiver` };
    const response = await this.http.get(`${backendUrl}/login-url`, { observe: 'response', params })
      .toPromise();
    return (response.body as any).loginUrl;
  }

  private async fetchEnvVar(varName: string): Promise<string> {
    if (!environment.packaged) {
      return environment[varName];
    }
    const response = await this.http.get(`${this.frontendUrl}/env/${varName}`, { observe: 'response' })
      .toPromise();
    return (response.body as string);
  }

  private async getBackendUrl(): Promise<string> {
    this.backendUrl = this.backendUrl || `${window.location.protocol}//${await this.fetchEnvVar('BACKEND_URL')}`;
    return this.backendUrl;
  };

  logOut(): void {
    window.localStorage.removeItem('accessToken');
    this.accessToken = undefined;
    this.router.navigate(['']);
  }

  async getAccessTokenFromCode(code: string): Promise<string> {
    const body = {
      code
    };
    const backendUrl = await this.getBackendUrl();
    const response = await this.http.post(`${backendUrl}/tokens`, body, { observe: 'response' })
      .toPromise();

    this.setAccessToken((response.body as any).accessToken);
    return this.accessToken;
  }

  async renewAccessToken(accessToken: string): Promise<string> {
    const body = { accessToken };
    let response;
    try {
      const backendUrl = await this.getBackendUrl();
      response = await this.http.post(`${backendUrl}/tokens`, body, { observe: 'response' })
        .toPromise();
    } catch (error) {
      if (error.status === 404) {
        this.logOut();
        throw error;
      }
    }
    this.setAccessToken((response.body as any).accessToken);
    return this.accessToken;
  }

  public async requestWithAuth(method: string, url: string, options?: any): Promise<HttpResponse<Object>> {
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
    this.accessToken = await this.renewAccessToken(this.accessToken);
    return await doRequest();
  }

  getAccessToken(): string {
    const accessToken = this.accessToken || window.localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token exists.');
    }
    return accessToken;
  }

  private setAccessToken(accessToken: string): void {
    if (!accessToken) {
      throw new Error("Expected response body to contain accessToken, but it didn't.");
    }
    this.accessToken = accessToken;
    window.localStorage.setItem('accessToken', accessToken);
  }

  async backendRequest(method: string, uri: string, options?: any): Promise<HttpResponse<Object>> {
    const backendUrl = await this.getBackendUrl();
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
