import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {

  public isPackaged: boolean;
  private variables: { [key: string]: Promise<string> } = {
    FRONTEND_URL: Promise.resolve(`${window.location.protocol}//${window.location.host}`)
  };

  constructor(private http: HttpClient) {
    this.isPackaged = environment.production;
  }

  // varName should be in all caps, like 'BACKEND_URL'
  public async get(varName: string): Promise<string> {
    if (this.variables[varName] != undefined) {
      return this.variables[varName];
    }
    this.variables[varName] = this.isPackaged
      ? (await this.http.get(`${await this.variables.FRONTEND_URL}/env/${varName}`, { observe: 'response' }).toPromise()).body as string
      : environment[varName];
    return this.variables[varName];
  }

}
