import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class MockEnvironmentService {
  private mockEnvironment: { [key: string]: any } = {};
  getVariable(varName: string): string {
    return this.mockEnvironment[varName];
  }
  setVariable(varName: string, value: any): void {
    this.mockEnvironment[varName] = value;
  }
};
