import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';

import { CodeReceiverComponent } from './code-receiver.component';
import { Router, UrlTree } from '@angular/router';

describe('CodeReceiverComponent', () => {
  let component: CodeReceiverComponent;
  let fixture: ComponentFixture<CodeReceiverComponent>;

  let authenticatorServiceStub: Partial<AuthenticatorService> = {
    isLoggedIn: () => true,
    getAccessTokenFromAuthorizationCode: (authorizationCode: string) => Promise.resolve('some-access-token')
  };

  let routerStub: Partial<Router> = {
    parseUrl: (_: string) => {
      const urlTree = new UrlTree();
      urlTree.queryParams = {
        code: 'some-code'
      };
      return urlTree;
    },
    navigate: () => Promise.resolve(true)
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CodeReceiverComponent],
      imports: [
        MatCardModule,
        MatProgressSpinnerModule,
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: authenticatorServiceStub
        },
        {
          provide: Router,
          useValue: routerStub
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeReceiverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {

    expect(component).toBeTruthy();
  });

});
