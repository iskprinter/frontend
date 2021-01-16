import { HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { CharacterService } from 'src/app/services/character/character.service';

import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authenticatorServiceStub: Partial<AuthenticatorService> = {
    isLoggedIn: () => true,
    requestWithAuth: <R>(method: string, url: string, options?: any) => {
      return new Promise<HttpResponse<R>>((resolve: (value?: HttpResponse<R>) => void, reject: (reason?: any) => void) => { });
    }
  };
  let mockCharacterService: jasmine.SpyObj<CharacterService>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      imports: [
        MatCardModule
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: authenticatorServiceStub
        },
        {
          provide: CharacterService,
          useValue: jasmine.createSpyObj('CharacterService', ['getCharacter'])
        }
      ]
    })
      .compileComponents();

    mockCharacterService = TestBed.inject(CharacterService) as jasmine.SpyObj<CharacterService>;

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
