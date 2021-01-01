import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {

  private variables: { [key: string]: Promise<string> } = {
    FRONTEND_URL: Promise.resolve(`${window.location.protocol}//${window.location.host}`)
  };

  constructor(private http: HttpClient) { }

  async getVariable(varName: string): Promise<string> {
    
    if (this.variables[varName] != undefined) {
      return this.variables[varName];
    }

    const requestUrl = `${await this.variables.FRONTEND_URL}/env/${varName}`;
    const variable = (await this.http.get<string>(requestUrl, { observe: 'response' }).toPromise()).body;
    this.variables[varName] = Promise.resolve(variable);
    return this.variables[varName];

  }

}
