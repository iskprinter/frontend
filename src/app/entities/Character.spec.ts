import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthenticatorService } from '../services/authenticator/authenticator.service';
import { HttpTester } from '../test/HttpTester';
import { Character } from './Character';

describe('Character', () => {

  let httpTestingController: HttpTestingController;
  let httpTester: HttpTester;
  let mockAuthenticatorService: AuthenticatorService;
  let character: Character;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: mockAuthenticatorService
        },
      ]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    httpTester = new HttpTester(httpTestingController);
    mockAuthenticatorService = TestBed.inject(AuthenticatorService);
    character = new Character(mockAuthenticatorService);

  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(character).toBeTruthy();
  });

  it('should be able to retrieve the character ID', async () => {

    // Arrange
    const token = {
      "CharacterID": 95465499,
      "CharacterName": "CCP Bartender",
      "ExpiresOn": "2017-07-05T14:34:16.5857101",
      "Scopes": "esi-characters.read_standings.v1",
      "TokenType": "Character",
      "CharacterOwnerHash": "lots_of_letters_and_numbers",
      "IntellectualProperty": "EVE"
    };
    mockAuthenticatorService.requestWithAuth = async (method: string, url: string) => {
      return new HttpResponse<any>({ status: 200, body: token });
    };

    // // Act
    // const id: number = await character.getId();

    // // Assert
    // expect(id).toBe(95465499);

  });

});
