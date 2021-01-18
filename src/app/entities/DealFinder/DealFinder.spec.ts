import { DealFinder } from './DealFinder';

import { FakeLocalStorageService } from './FakeLocalStorage';
import happyVolumeHistory from './happyVolumeHistoryTypeId2267.json';
import { TestBed } from '@angular/core/testing';
import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { CharacterService } from 'src/app/services/character/character.service';
import { LocalStorageService } from 'src/app/services/local-storage/local-storage.service';

describe('DealFinder', () => {

  let spyAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;
  let fakeLocalStorageService: FakeLocalStorageService;
  let spyCharacterService: jasmine.SpyObj<CharacterService>;

  let dealFinder: DealFinder;

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
          useClass: FakeLocalStorageService
        },
        {
          provide: CharacterService,
          useValue: jasmine.createSpyObj('CharacterService', ['getOrdersOfCharacter'])
        }
      ]
    });

    spyAuthenticatorService = TestBed.inject(AuthenticatorService) as jasmine.SpyObj<AuthenticatorService>;
    fakeLocalStorageService = TestBed.inject(LocalStorageService) as any as FakeLocalStorageService;
    spyCharacterService = TestBed.inject(CharacterService) as jasmine.SpyObj<CharacterService>;

    dealFinder = new DealFinder(
      spyAuthenticatorService,
      fakeLocalStorageService,
      spyCharacterService
    );

  });

  it('should properly categorize historical volume', () => {
    const analyzedHistory = dealFinder._analyzeHistory(happyVolumeHistory);
    expect(dealFinder).toBeTruthy();
  });

});
