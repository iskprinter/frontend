import { LocalStorageInterface } from './LocalStorageInterface';

export class FakeLocalStorage implements LocalStorageInterface {

    data: object = {};

    setItem(key: string, value: string) {
        this.data[key] = value;
    }

    getItem(key: string) {
        return this.data[key];
    }

}
