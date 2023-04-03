import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Title } from '@angular/platform-browser';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {

  title: string;

  constructor(
    public authenticatorService: AuthenticatorService, 
    private breakpointObserver: BreakpointObserver,
    private titleService: Title
  ) {
    this.title = this.titleService.getTitle();
  }

  isLoggedIn() {
    return this.authenticatorService.isLoggedIn();
  }

  logOut() {
    this.authenticatorService.logOut();
  }

}
