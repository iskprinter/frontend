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

      this.character = await this.characterService.getCharacter();
      const [
        characterLocation,
        characterPortrait,
        characterWalletBalance
      ] = await Promise.all([
        this.characterService.getLocationOfCharacter(this.character),
        this.character.getPortrait(),
        this.character.getWalletBalance()
      ]);
      this.character.location = characterLocation;
      this.characterUpdate.emit(this.character);
    }
  }

}
