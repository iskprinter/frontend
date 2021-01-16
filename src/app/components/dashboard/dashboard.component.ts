import { Component } from '@angular/core';

import { Character } from 'src/app/entities/Character';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  character: Character;

  constructor() { }

  setCharacter(character: Character) {
    this.character = character;
  }

}
