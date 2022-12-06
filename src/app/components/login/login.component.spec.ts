import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LayoutModule } from '@angular/cdk/layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';

import { LoginComponent } from './login.component';
import { EnvironmentService } from 'src/app/services/environment/environment.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let authenticatorServiceStub: Partial<AuthenticatorService> = {
    getLoginUrl: () => Promise.resolve('loginUrl')
  };
  let environmentServiceStub: Partial<EnvironmentService> = {
    getVariable: () => Promise.resolve('some-client-id')
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        BrowserAnimationsModule,
        LayoutModule,
        MatButtonModule,
        MatCardModule,
        MatGridListModule,
        MatIconModule,
        MatMenuModule,
        MatSnackBarModule,
      ],
      providers: [
        { provide: AuthenticatorService, useValue: authenticatorServiceStub },
        { provide: EnvironmentService, useValue: environmentServiceStub }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
