import { HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';

import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  let authenticatorServiceStub: Partial<AuthenticatorService> = {
    isLoggedIn: () => true,
    requestWithAuth: (method: string, url: string, options?: any) =>  {
      return new Promise<HttpResponse<Object>>((resolve: (value?: HttpResponse<Object>) => void, reject: (reason?: any) => void) => {});
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfileComponent ],
      imports: [
        MatCardModule
      ],
      providers: [ { provide: AuthenticatorService, useValue: authenticatorServiceStub } ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
