import { Component, OnInit } from '@angular/core';

import { Character } from 'src/app/entities/Character';
import { CharacterLocation } from 'src/app/entities/CharacterLocation'
import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { IskprinterApiService } from 'src/app/services/iskprinter-api/iskprinter-api.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  characterId: number;
  characterName: string;
  characterPortraitUrl: string;
  characterLocation: CharacterLocation;
  characterWalletBalance: number;

  constructor(
    public authenticatorService: AuthenticatorService,
    public iskprinterApiService: IskprinterApiService,
  ) { }

  async ngOnInit(): Promise<void> {
    const character = this.authenticatorService.getCharacterFromToken();
    this.characterId = character.characterId;
    this.characterName = character.characterName;

    this.iskprinterApiService.getCharacterPortrait(this.characterId).subscribe({
      next: ({portraitUrl}) => this.characterPortraitUrl = portraitUrl
    });

  //   const [
  //     characterLocation,
  //     characterWalletBalance
  //   ] = await Promise.allSettled([
  //     this.characterService.getLocationOfCharacter(this.character),
  //     this.characterService.getWalletBalanceOfCharacter(this.character)
  //   ]);
  //   this.characterLocation = characterLocation.status === 'fulfilled' ? characterLocation.value : undefined;
  //   this.characterWalletBalance = characterWalletBalance.status === 'fulfilled' ? characterWalletBalance.value : undefined;
  }

}
