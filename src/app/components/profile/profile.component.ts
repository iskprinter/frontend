import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Character, CharacterLocation } from 'src/app/entities/Character';
import { CharacterService } from 'src/app/services/character/character.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  character: Character;
  characterPortrait: string;
  characterLocation: CharacterLocation;
  characterWalletBalance: number;

  constructor(
    public authenticatorService: AuthenticatorService,
    public characterService: CharacterService,
  ) { }

  async ngOnInit(): Promise<void> {
    if (this.authenticatorService.isLoggedIn()) {

      this.character = await this.characterService.getCharacterFromToken();
      const [
        characterLocation,
        characterPortrait,
        characterWalletBalance
      ] = await Promise.allSettled([
        this.characterService.getLocationOfCharacter(this.character),
        this.characterService.getPortraitOfCharacter(this.character),
        this.characterService.getWalletBalanceOfCharacter(this.character)
      ]);
      this.characterLocation = characterLocation.status === 'fulfilled' ? characterLocation.value : undefined;
      this.characterPortrait = characterPortrait.status === 'fulfilled' ? characterPortrait.value : undefined;
      this.characterWalletBalance = characterWalletBalance.status === 'fulfilled' ? characterWalletBalance.value : undefined;
    }
  }

}
