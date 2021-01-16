import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Character, CharacterLocation } from 'src/app/entities/Character';
import { AuthenticatorService } from '../authenticator/authenticator.service';

import { CharacterService } from './character.service';

describe('CharacterService', () => {

  let service: CharacterService;
  let mockAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;
  let character: Character;

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

    // Create a default character (some tests will reinstantiate this)
    character = new Character(mockAuthenticatorService);
    character.id = 95448633;
    character.name = 'Kronn 8';

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
    character = await service.getCharacter();

    // Assert
    expect(character.id).toBe(95465499);
    expect(character.name).toBe('CCP Bartender');

  });

  it('should properly fetch the location of a character', async () => {

    // Arrange
    const locationData = {
      solar_system_id: 30004759,
      structure_id: 1030049082711
    };
    mockAuthenticatorService.eveRequest
      .and.resolveTo(new HttpResponse<any>({ status: 200, body: locationData }));

    // Act
    const characterLocation: CharacterLocation = await service.getLocationOfCharacter(character);

    // Assert
    expect(characterLocation.solarSystemId).toBe(30004759);
    expect(characterLocation.structureId).toBe(1030049082711);

  });

});
