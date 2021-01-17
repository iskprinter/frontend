import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthenticatorService } from './services/authenticator/authenticator.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ISK Printer';

  public constructor(
    private titleService: Title,
    public authenticatorService: AuthenticatorService
  ) {
    this.titleService.setTitle(this.title);
  }

}
