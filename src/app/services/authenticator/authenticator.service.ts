import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticatorInterface } from './authenticator.interface';
import { EnvironmentService } from 'src/app/services/environment/environment.service';

@Injectable({ providedIn: 'root' })
export class AuthenticatorService implements AuthenticatorInterface {

  private accessToken: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private environment: EnvironmentService,
  ) {
    this.accessToken = window.localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
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
    const response = await this.http.get(`${BACKEND_URL}/login-url`, { observe: 'response', params }).toPromise();
    return (response.body as any).loginUrl;
  }

  logOut(): void {
    window.localStorage.removeItem('accessToken');
    this.accessToken = undefined;
    this.router.navigate(['']);
  }

  async getAccessTokenFromCode(code: string): Promise<string> {
    const body = { code };
    const BACKEND_URL = await this.environment.getVariable('BACKEND_URL');
    const response = await this.http.post(`${BACKEND_URL}/tokens`, body, { observe: 'response' }).toPromise();

    this.setAccessToken((response.body as any).accessToken);
    return this.accessToken;
  }

  async renewAccessToken(accessToken: string): Promise<string> {
    const body = { accessToken };
    let response;
    try {
      const backendUrl = await this.environment.getVariable('BACKEND_URL');
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
