import { Component, OnInit } from '@angular/core';
import { SimpleSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { EnvironmentService } from 'src/app/services/environment/environment.service';
import { RequestInformerService } from 'src/app/services/request-informer/request-informer.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginUrl: string;
  loginButtonDisabled: boolean = false;

  constructor(
    public authenticatorService: AuthenticatorService,
    public requestInformer: RequestInformerService,
    public environmentService: EnvironmentService
  ) { }

  ngOnInit(): void {
    this.loginButtonDisabled = true;
    this.environmentService.getVariable('CLIENT_ID').subscribe((clientId) => {
      const loginUrl = this.authenticatorService.getLoginUrl(clientId);
      this.loginUrl = loginUrl;
      this.loginButtonDisabled = false;
    });
  }

}
