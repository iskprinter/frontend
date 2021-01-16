import { Injectable } from '@angular/core';
import { Character } from 'src/app/entities/Character';
import { AuthenticatorService } from '../authenticator/authenticator.service';

@Injectable({ providedIn: 'root' })
export class CharacterService {

  constructor(
    private authenticatorService: AuthenticatorService
  ) { }

  async getCharacter(): Promise<Character> {

    type CharacterDataBasic = {
      CharacterID: number;
      CharacterName: string;
      ExpiresOn: string;
      Scopes: string;
      TokenType: string;
      CharacterOwnerHash: string;
      IntellectualProperty: string;
    };

    const response = await this.authenticatorService.eveRequest<CharacterDataBasic>(
      'get',
      'https://login.eveonline.com/oauth/verify'
    );
    const characterData = response.body;
    const character = new Character(
      this.authenticatorService
    );
    character.id = characterData.CharacterID;
    character.name = characterData.CharacterName;
    return character;

  }

}
