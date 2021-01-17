import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { AuthenticatorService } from 'src/app/services/authenticator/authenticator.service';
import { CharacterService } from 'src/app/services/character/character.service';

import { IntrastationDealsComponent } from './intrastation-deals.component';

describe('IntrastationDealsComponent', () => {
  let component: IntrastationDealsComponent;
  let fixture: ComponentFixture<IntrastationDealsComponent>;

  let authenticatorServiceStub: Partial<AuthenticatorService> = {
    isLoggedIn: () => true,
  };
  let spyCharacterService;

  beforeEach(waitForAsync(() => {
    
    TestBed.configureTestingModule({
      declarations: [IntrastationDealsComponent],
      imports: [
        MatCardModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatTableModule
      ],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: authenticatorServiceStub
        },
        {
          provide: CharacterService,
          useValue: jasmine.createSpyObj('CharacterService', ['getOrdersOfCharacter'])
        }
      ]
    })
      .compileComponents();

    spyCharacterService = TestBed.inject(CharacterService);

  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntrastationDealsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
