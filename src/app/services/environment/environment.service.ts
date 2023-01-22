import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EnvironmentService {

  private variables: { [key: string]: string } = {
    FRONTEND_URL: `${this.document.location.protocol}//${this.document.location.host}`
  };

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private http: HttpClient
  ) { }

  getVariable<T>(varName: string): Observable<string> {
    return new Observable((subscriber) => {
      if (this.variables[varName] != undefined) {
        return subscriber.next(this.variables[varName]);
      }
      const requestUrl = `${this.variables.FRONTEND_URL}/env/${varName}`;
      return this.http.get<string>(requestUrl)
        .subscribe({
          next: (variable) => {
            this.variables[varName] = variable;
            return subscriber.next(this.variables[varName]);
          }
        });
    });
  }
}
