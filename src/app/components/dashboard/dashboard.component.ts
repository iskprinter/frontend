import { Component, OnInit } from '@angular/core';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { Character } from 'src/app/entities/Character';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  character: Character;

  constructor(
    public authenticatorService: AuthenticatorService,
  ) { }

  ngOnInit(): void {
  }

  setCharacter(character: Character) {
    this.character = character;
  }

}
