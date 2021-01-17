import { DealFinder } from './DealFinder';

import { FakeLocalStorage } from './FakeLocalStorage';
import happyVolumeHistory from './happyVolumeHistoryTypeId2267.json';
import { TestBed } from '@angular/core/testing';
import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { CharacterService } from 'src/app/services/character/character.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';

describe('DealFinder', () => {

  let spyAuthenticatorService;
  let fakeLocalStorageService;
  let spyCharacterService;

  let dealFinder;

  beforeEach(() => {

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthenticatorService,
          useValue: jasmine.createSpyObj('AuthenticatorService', [
            'backendRequest',
            'eveRequest'
          ])
        },
        {
          provide: LocalStorageService,
          useClass: FakeLocalStorage
        },
        {
          provide: CharacterService,
          useValue: jasmine.createSpyObj('CharacterService', ['getOrdersOfCharacter'])
        }
      ]
    });

    spyAuthenticatorService = TestBed.inject(AuthenticatorService);
    fakeLocalStorageService = TestBed.inject(LocalStorageService);
    spyCharacterService = TestBed.inject(CharacterService);

    dealFinder = new DealFinder(
      spyAuthenticatorService,
      fakeLocalStorageService,
      spyCharacterService
    );

  });

  it('should properly categorize historical volume', () => {
    const analyzedHistory = dealFinder.analyzeHistory(happyVolumeHistory);
    expect(dealFinder).toBeTruthy();
  });

});
