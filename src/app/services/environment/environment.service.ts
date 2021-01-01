import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {

  private variables: { [key: string]: Promise<string> } = {
    FRONTEND_URL: Promise.resolve(`${this.document.location.protocol}//${this.document.location.host}`)
  };

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private http: HttpClient
  ) { }

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
