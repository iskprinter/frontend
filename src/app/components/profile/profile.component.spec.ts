import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';

import { CharacterService } from 'src/app/services/character/character.service';

import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let spyCharacterService: jasmine.SpyObj<CharacterService>;

  beforeEach(waitForAsync(() => {

    spyCharacterService = jasmine.createSpyObj('CharacterService', [
      'getCharacterFromToken',
      'getLocationOfCharacter',
      'getPortraitOfCharacter',
      'getWalletBalanceOfCharacter'
    ]);

    TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      imports: [
        MatCardModule
      ],
      providers: [
        {
          provide: CharacterService,
          useValue: spyCharacterService
        }
      ]
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
