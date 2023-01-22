import { TestBed } from '@angular/core/testing';
import { Character } from 'src/app/entities/Character';
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
          useValue: jasmine.createSpyObj('AuthenticatorService', [
            'backendRequest',
            'eveRequest',
            'getAccessToken'
          ])
        }
      ]
    });

    mockAuthenticatorService = TestBed.inject(AuthenticatorService) as jasmine.SpyObj<AuthenticatorService>;
    service = TestBed.inject(CharacterService);

    // Create a default character (some tests will reinstantiate this)
    character = {
      id: 95448633,
      name: 'Kronn 8',
    };

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCharacterFromToken', () => {

    it('should properly fetch basic character data from token', async () => {

      // Arrange
      const jwt = 'some-first-part.eyJzY3AiOlsiZXNpLWFzc2V0cy5yZWFkX2Fzc2V0cy52MSIsImVzaS1jaGFyYWN0ZXJzdGF0cy5yZWFkLnYxIiwiZXNpLWNsb25lcy5yZWFkX2Nsb25lcy52MSIsImVzaS1sb2NhdGlvbi5yZWFkX2xvY2F0aW9uLnYxIiwiZXNpLW1hcmtldHMucmVhZF9jaGFyYWN0ZXJfb3JkZXJzLnYxIiwiZXNpLW1hcmtldHMuc3RydWN0dXJlX21hcmtldHMudjEiLCJlc2ktc2tpbGxzLnJlYWRfc2tpbGxzLnYxIiwiZXNpLXVuaXZlcnNlLnJlYWRfc3RydWN0dXJlcy52MSIsImVzaS13YWxsZXQucmVhZF9jaGFyYWN0ZXJfd2FsbGV0LnYxIl0sImp0aSI6Ijc3ZDZmMzdmLTdjNmQtNGZlMi1hZTg2LTdhZjFjMmRmMzg1YSIsImtpZCI6IkpXVC1TaWduYXR1cmUtS2V5Iiwic3ViIjoiQ0hBUkFDVEVSOkVWRTo5NTQ0ODYzMyIsImF6cCI6ImJmOTY3NGJkZTRjZDQzMjE5M2FjNTY0NGRhZjM4YjA3IiwidGVuYW50IjoidHJhbnF1aWxpdHkiLCJ0aWVyIjoibGl2ZSIsInJlZ2lvbiI6IndvcmxkIiwiYXVkIjoiRVZFIE9ubGluZSIsIm5hbWUiOiJLcm9ubiA4Iiwib3duZXIiOiI2RS9DNENFSUk1dGZZN3RaV1kxL0xFWG9DUEk9IiwiZXhwIjoxNjU0NjUyMjA5LCJpYXQiOjE2NTQ2NTEwMDksImlzcyI6ImxvZ2luLmV2ZW9ubGluZS5jb20ifQ.some-final-part';
      mockAuthenticatorService.getAccessToken.withArgs().and.returnValue(jwt);

      // Act
      character = await service.getCharacterFromToken();

      // Assert
      expect(character.id).toBe(95448633);
      expect(character.name).toBe('Kronn 8');

    });

  });

});
