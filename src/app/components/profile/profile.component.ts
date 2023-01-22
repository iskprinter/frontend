import { Component, OnInit } from '@angular/core';

import { Character } from 'src/app/entities/Character';
import { CharacterLocation } from 'src/app/entities/CharacterLocation'
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
    public characterService: CharacterService,
  ) { }

  async ngOnInit(): Promise<void> {
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
