import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';

import { ProfileComponent } from './profile.component';
import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { IskprinterApiService } from 'src/app/services/iskprinter-api/iskprinter-api.service';
import { Observable } from 'rxjs';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  let spyAuthenticatorService: jasmine.SpyObj<AuthenticatorService>;
  let spyIskprinterApiService: jasmine.SpyObj<IskprinterApiService>;

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      imports: [
        MatCardModule
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: jasmine.createSpyObj('AuthenticatorService', ['getCharacterFromToken'])
        },
        {
          provide: IskprinterApiService,
          useValue: jasmine.createSpyObj('IskprinterService', ['getCharacterPortrait'])
        },
      ],
    })
      .compileComponents();

    spyAuthenticatorService = TestBed.inject(AuthenticatorService) as jasmine.SpyObj<AuthenticatorService>;
    spyAuthenticatorService.getCharacterFromToken.and.returnValue({
      characterId: 12345,
      characterName: 'some-character-name',
    });
    spyIskprinterApiService = TestBed.inject(IskprinterApiService) as jasmine.SpyObj<IskprinterApiService>;
    spyIskprinterApiService.getCharacterPortrait.and.returnValue(
      new Observable((subscriber) => subscriber.next({ portraitUrl: 'some-portrait' }))
    )
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
