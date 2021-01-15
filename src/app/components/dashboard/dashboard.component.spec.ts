import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Character } from 'src/app/entities/Character';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';

import { DashboardComponent } from './dashboard.component';

@Component({
  selector: 'app-intrastation-deals',
  template: ''
})
class MockIntrastationDealsComponent {
  @Input() character: Character;
}

@Component({
  selector: 'app-profile',
  template: ''
})
class MockProfileComponent { }

describe('DashboardComponent', () => {

  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let authenticatorServiceStub: Partial<AuthenticatorService> = {
    isLoggedIn: () => true,
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        DashboardComponent,
        MockIntrastationDealsComponent,
        MockProfileComponent
      ],
      providers: [ { provide: AuthenticatorService, useValue: authenticatorServiceStub } ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
