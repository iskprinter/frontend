import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';

import { AuthenticatorService } from './authenticator.service';
import { EnvironmentService } from '../environment/environment.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { blockUntilRequestReceived } from 'src/app/test/utils';
import { MockLocalStorageService } from 'src/app/test/MockLocalStorageService';
import { MockEnvironmentService } from 'src/app/test/MockEnvironmentService';

describe('AuthenticatorService', () => {

  let httpTestingController: HttpTestingController;
  let defaultMockBackendUrl = 'http://some-backend-url';
  let defaultMockFrontendUrl = 'http://some-frontend-url';

  let mockLocalStorageService: MockLocalStorageService;
  let mockEnvironmentService: MockEnvironmentService;

  let service: AuthenticatorService;

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: EnvironmentService,
          useClass: MockEnvironmentService
        },
        {
          provide: LocalStorageService,
          useClass: MockLocalStorageService
        }
      ]
    });
    mockEnvironmentService = TestBed.inject(EnvironmentService) as any as MockEnvironmentService;
    mockEnvironmentService.setVariable('BACKEND_URL', defaultMockBackendUrl);
    mockEnvironmentService.setVariable('FRONTEND_URL', defaultMockFrontendUrl);
    httpTestingController = TestBed.inject(HttpTestingController);
    mockLocalStorageService = TestBed.inject(LocalStorageService) as any as MockLocalStorageService;
    service = TestBed.inject(AuthenticatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should properly assess that the user is logged in', () => {
    mockLocalStorageService.setItem('accessToken', 'some-token');
    const loginState = service.isLoggedIn();
    expect(loginState).toBe(true);
  });

  it('should properly assess that the user is logged out', () => {
    mockLocalStorageService.removeItem('accessToken');
    const loginState = service.isLoggedIn();
    expect(loginState).toBe(false);
  });

  it('should get the login url properly', async () => {

    // Arrange
    const requestToMatch = `${defaultMockBackendUrl}/login-url?callback-url=${defaultMockFrontendUrl}/code-receiver`;
    const mockResponse = `https://login.eveonline.com/oauth/authorize?response_type=code&redirect_uri=${defaultMockFrontendUrl}/code-receiver&client_id=a0b0fa3fd6ee47af82c9cb8ae3f51595&scope=esi-assets.read_assets.v1%20esi-characterstats.read.v1%20esi-clones.read_clones.v1%20esi-location.read_location.v1%20esi-markets.read_character_orders.v1%20esi-markets.structure_markets.v1%20esi-skills.read_skills.v1%20esi-universe.read_structures.v1%20esi-wallet.read_character_wallet.v1"`;

    // Act
    const pendingRequest = service.fetchLoginUrl();
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestToMatch);
    req.flush(mockResponse);
    const loginUrl = await pendingRequest;

    // Assert
    expect(req.request.method).toBe('GET');
    expect(loginUrl).toEqual(mockResponse);

  });

});
