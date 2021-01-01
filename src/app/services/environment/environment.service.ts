import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
    let variable;
    try {
      variable = (await this.http.get<string>(requestUrl, { observe: 'response' }).toPromise()).body;
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        // leave variable as undefined
      } else {
        throw err;
      }
    }
    this.variables[varName] = Promise.resolve(variable);
    return this.variables[varName];

  }

}
