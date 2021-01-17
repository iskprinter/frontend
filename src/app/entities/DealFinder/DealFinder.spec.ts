import { DealFinder } from './DealFinder';
import { HttpResponse } from '@angular/common/http';

import { FakeLocalStorage } from './FakeLocalStorage';
import { AuthenticatorInterface } from '../../services/authenticator/authenticator.interface';
import happyVolumeHistory from './happyVolumeHistoryTypeId2267.json';

describe('DealFinder', () => {

  let stubAuthenticatorService: AuthenticatorInterface = {
    eveRequest: <R>(method: string, url: string, options?: any) =>  {
      return new Promise<HttpResponse<R>>((resolve: (value?: HttpResponse<R>) => void, reject: (reason?: any) => void) => {});
    },
    backendRequest: <R>(method: string, url: string, options?: any) =>  {
      return new Promise<HttpResponse<R>>((resolve: (value?: HttpResponse<R>) => void, reject: (reason?: any) => void) => {});
    }
  };

  let fakeLocalStorage;
  let dealFinder

  beforeEach(() => {
    fakeLocalStorage = new FakeLocalStorage();
    dealFinder = new DealFinder(stubAuthenticatorService, fakeLocalStorage);
  });

  it('should properly categorize historical volume', () => {
    const analyzedHistory = dealFinder.analyzeHistory(happyVolumeHistory);
    expect(dealFinder).toBeTruthy();
  });

});
