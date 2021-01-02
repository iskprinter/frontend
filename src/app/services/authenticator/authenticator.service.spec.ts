import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';

import { AuthenticatorService } from './authenticator.service';
import { EnvironmentService } from '../environment/environment.service';
import { LocalStorageService } from '../local-storage/local-storage.service';

describe('AuthenticatorService', () => {
  
  let httpTestingController: HttpTestingController;
  let defaultMockBackendUrl = 'http://some-backend-url';
  let defaultMockFrontendUrl = 'http://some-frontend-url';
  const mockEnvironment = {
    BACKEND_URL: defaultMockBackendUrl,
    FRONTEND_URL: defaultMockFrontendUrl
  };
  let mockEnvironmentService = {
    getVariable: (varName) => {
      return mockEnvironment[varName];
    }
  };

  class MockLocalStorageService {
    public storage: { [key: string]: any } = {};
    clear(): void { this.storage = {}; }
    getItem(key: string): any { return this.storage[key]; }
    removeItem(key: string): void { delete this.storage[key]; }
    setItem(key: string, value: any): void { this.storage[key] = value; }
  };
  let mockLocalStorageService = new MockLocalStorageService();

  let service: AuthenticatorService;

  const blockUntilRequestReceived = async (httpMock: any) => {
    const INTERVAL = 100; // ms
    while ((httpMock as any).open.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, INTERVAL));
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        {
          provide: EnvironmentService,
          useValue: mockEnvironmentService
        },
        {
          provide: LocalStorageService,
          useValue: mockLocalStorageService
        }
      ]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthenticatorService);
    mockLocalStorageService.clear();
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
    const requestToMatch = `${mockEnvironment.BACKEND_URL}/login-url?callback-url=${mockEnvironment.FRONTEND_URL}/code-receiver`;
    const mockResponse = `https://login.eveonline.com/oauth/authorize?response_type=code&redirect_uri=${mockEnvironment.FRONTEND_URL}/code-receiver&client_id=a0b0fa3fd6ee47af82c9cb8ae3f51595&scope=esi-assets.read_assets.v1%20esi-characterstats.read.v1%20esi-clones.read_clones.v1%20esi-location.read_location.v1%20esi-markets.read_character_orders.v1%20esi-markets.structure_markets.v1%20esi-skills.read_skills.v1%20esi-universe.read_structures.v1%20esi-wallet.read_character_wallet.v1"`;

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
