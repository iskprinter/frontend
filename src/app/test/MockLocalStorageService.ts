import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class MockLocalStorageService {
  public storage: { [key: string]: any } = {};
  clear(): void { this.storage = {}; }
  getItem(key: string): any { return this.storage[key]; }
  removeItem(key: string): void { delete this.storage[key]; }
  setItem(key: string, value: any): void { this.storage[key] = value; }
};
