import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthenticatorService } from '../services/authenticator/authenticator.service';
import { HttpTester } from '../test/HttpTester';
import { Character } from './Character';

describe('Character', () => {

    let httpTestingController: HttpTestingController;
    let httpTester: HttpTester;
    let mockAuthenticatorService: AuthenticatorService;
    let character: Character;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
            ],
            providers: [
                {
                    provide: AuthenticatorService,
                    useValue: mockAuthenticatorService
                },
            ]
        });

        httpTestingController = TestBed.inject(HttpTestingController);
        httpTester = new HttpTester(httpTestingController);
        mockAuthenticatorService = TestBed.inject(AuthenticatorService);
        character = new Character(mockAuthenticatorService);
        
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(character).toBeTruthy();
    });

});
