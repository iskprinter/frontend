import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService implements Storage {

  private localStorage: Storage = window.localStorage;

  constructor() { }

  [name: string]: any;
  length: number;

  clear(): void {
    return this.localStorage.clear();
  }
  
  getItem(key: string): string {
    return this.localStorage.getItem(key);
  }

  key(index: number): string {
    return this.localStorage.key(index);
  }

  removeItem(key: string): void {
    return this.localStorage.removeItem(key);
  }

  setItem(key: string, value: string): void {
    return this.localStorage.setItem(key, value);
  }

}
