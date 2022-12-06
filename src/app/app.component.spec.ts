import { Component } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AuthenticatorService } from './services/authenticator/authenticator.service';

@Component({
  selector: 'app-nav',
  template: ''
})
class MockNavComponent { }

@Component({
  selector: 'app-notifier',
  template: ''
})
class MockNotifierComponent { }

@Component({
  selector: 'app-sidenav',
  template: ''
})
class MockSidenavComponent { }

describe('AppComponent', () => {

  let mockAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent,
        MockNavComponent,
        MockNotifierComponent,
        MockSidenavComponent,
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: jasmine.createSpyObj('AuthenticatorService', ['eveRequest'])
        }
      ]
    }).compileComponents();

    mockAuthenticatorService = TestBed.inject(AuthenticatorService) as jasmine.SpyObj<AuthenticatorService>;

  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the proper title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('ISK Printer');
  });

});
