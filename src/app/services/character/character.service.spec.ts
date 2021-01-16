import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AuthenticatorService } from '../authenticator/authenticator.service';

import { CharacterService } from './character.service';

describe('CharacterService', () => {

  let service: CharacterService;
  let mockAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthenticatorService,
          useValue: jasmine.createSpyObj('AuthenticatorService', ['eveRequest'])
        }
      ]
    });

    mockAuthenticatorService = TestBed.inject(AuthenticatorService) as jasmine.SpyObj<AuthenticatorService>;
    service = TestBed.inject(CharacterService);

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should properly fetch basic character data from token', async () => {

    // Arrange
    const tokenData = {
      "CharacterID": 95465499,
      "CharacterName": "CCP Bartender",
      "ExpiresOn": "2017-07-05T14:34:16.5857101",
      "Scopes": "esi-characters.read_standings.v1",
      "TokenType": "Character",
      "CharacterOwnerHash": "lots_of_letters_and_numbers",
      "IntellectualProperty": "EVE"
    };
    mockAuthenticatorService.eveRequest
      .and.resolveTo(new HttpResponse<any>({ status: 200, body: tokenData }));

    // Act
    const character = await service.getCharacter();

    // Assert
    expect(character.id).toBe(95465499);
    expect(character.name).toBe('CCP Bartender');

  });

});
