import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';

import { AuthenticatorService } from './authenticator.service';
import { EnvironmentService } from '../environment/environment.service';

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
        }
      ]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthenticatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // it('should properly assess whether the user is logged in', () => {

  // });

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
