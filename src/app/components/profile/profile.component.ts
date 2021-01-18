import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Character } from 'src/app/entities/Character';
import { CharacterService } from 'src/app/services/character/character.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  character: Character;
  @Output() characterUpdate = new EventEmitter<Character>();

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
        this.character.getWalletBalance()
      ]);
      this.character.location = characterLocation.status === 'fulfilled' ? characterLocation.value : undefined;
      this.character.portrait = characterPortrait.status === 'fulfilled' ? characterPortrait.value : undefined;

      this.characterUpdate.emit(this.character);
    }
  }

}
