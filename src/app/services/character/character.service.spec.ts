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

});
