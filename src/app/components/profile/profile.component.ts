import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Character } from 'src/app/entities/Character';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  character: any;
  @Output() characterUpdate = new EventEmitter<Character>();

  constructor(
    public authenticatorService: AuthenticatorService,
  ) { }

  async ngOnInit(): Promise<void> {
    if (this.authenticatorService.isLoggedIn()) {
      
      this.character = new Character(this.authenticatorService);
      await this.character.getId();
      await Promise.all([
        this.character.getLocation(),
        this.character.getPortrait(),
        this.character.getWalletBalance()
      ]);
      this.characterUpdate.emit(this.character);
    }
  }

}
