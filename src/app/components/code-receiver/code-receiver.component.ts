import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';

@Component({
  selector: 'app-code-receiver',
  templateUrl: './code-receiver.component.html',
  styleUrls: ['./code-receiver.component.scss']
})
export class CodeReceiverComponent implements OnInit {
  message: string = 'Completing authentication...'
  spinnerVisible: boolean = true

  constructor(
    public authenticatorService: AuthenticatorService,
    private router: Router,
  ) { }

  ngOnInit(): void {

    const parsedUrl = this.router.parseUrl(this.router.url);
    if (parsedUrl.queryParams.code) {

      this.authenticatorService.getAccessTokenFromAuthorizationCode(parsedUrl.queryParams.code)
        .then(() => this.router.navigate(['']))
        .catch((error) => {
          this.message = 'Authentication failed :('
          this.spinnerVisible = false;
          console.error(error);
        });

    } else {
      this.message = 'Authentication failed :('
      this.spinnerVisible = false;
      console.error('No code found in URL.');
    }

  }
  
}
