import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class MockEnvironmentService {
  private mockEnvironment: { [key: string]: any } = {};
  getVariable(varName: string): Observable<string> {
    return new Observable((subscriber) => subscriber.next(this.mockEnvironment[varName]));
  }
  setVariable(varName: string, value: any): void {
    this.mockEnvironment[varName] = value;
  }
};
