import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';

import { AuthenticatorService } from './authenticator.service';
import { EnvironmentService } from '../environment/environment.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { HttpTester, HttpTestSettings } from 'src/app/test/HttpTester';
import { MockLocalStorageService } from 'src/app/test/MockLocalStorageService';
import { MockEnvironmentService } from 'src/app/test/MockEnvironmentService';
import { Router } from '@angular/router';
import { HttpParams, HttpResponse } from '@angular/common/http';
import { NoValidCredentialsError } from 'src/app/errors/NoValidCredentialsError';

describe('AuthenticatorService', () => {

  let httpTestingController: HttpTestingController;
  let httpTester: HttpTester;
  let defaultMockBackendUrl = 'http://some-backend-url';
  let defaultMockFrontendUrl = 'http://some-frontend-url';

  let mockLocalStorageService: MockLocalStorageService;
  let mockEnvironmentService: MockEnvironmentService;
  let spyRouter: jasmine.SpyObj<Router>;

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
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate'])
        }
      ]
    });
    mockEnvironmentService = TestBed.inject(EnvironmentService) as any as MockEnvironmentService;
    mockEnvironmentService.setVariable('BACKEND_URL', defaultMockBackendUrl);
    mockEnvironmentService.setVariable('FRONTEND_URL', defaultMockFrontendUrl);
    httpTestingController = TestBed.inject(HttpTestingController);
    httpTester = new HttpTester(httpTestingController);
    mockLocalStorageService = TestBed.inject(LocalStorageService) as any as MockLocalStorageService;
    spyRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    service = TestBed.inject(AuthenticatorService);

  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Sign-in and sign-out', () => {


    it('should throw an error if there is no access token', () => {
      expect(() => service.getAccessToken())
        .toThrowError(NoValidCredentialsError);
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
      const requestMethodOracle = 'get';
      const mockResponse = `https://login.eveonline.com/oauth/authorize?response_type=code&redirect_uri=${defaultMockFrontendUrl}/code-receiver&client_id=a0b0fa3fd6ee47af82c9cb8ae3f51595&scope=esi-assets.read_assets.v1%20esi-characterstats.read.v1%20esi-clones.read_clones.v1%20esi-location.read_location.v1%20esi-markets.read_character_orders.v1%20esi-markets.structure_markets.v1%20esi-skills.read_skills.v1%20esi-universe.read_structures.v1%20esi-wallet.read_character_wallet.v1"`;
      const httpTestSettings = {
        requestFunction: () => service.fetchLoginUrl(),
        responses: [
          {
            body: mockResponse,
          }
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<string>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(`${defaultMockBackendUrl}/login-url`);
      expect(httpTestResult.requests[0].params)
        .toEqual(new HttpParams({
          fromObject: {
            'callback-url': `${defaultMockFrontendUrl}/code-receiver`
          }
        }));
      expect(httpTestResult.requests[0].method.toLowerCase()).toBe(requestMethodOracle.toLowerCase());
      await expectAsync(httpTestResult.response()).toBeResolvedTo(mockResponse);

    });

    it('should log out properly', () => {

      // Arrange
      mockLocalStorageService.setItem('accessToken', 'some-token');

      // Act
      service.logOut();

      // Assert
      const token = mockLocalStorageService.getItem('accessToken');
      expect(token).toBe(undefined);
      expect(spyRouter.navigate).toHaveBeenCalledWith(['/login']);

    });

    it('should properly exchange an authorization code for an access token', async () => {

      // Arrange
      const requestUrlOracle = `${defaultMockBackendUrl}/tokens`;
      const authorizationCode = 'some-code';
      const requestBodyOracle = {
        proofType: 'authorizationCode',
        proof: authorizationCode
      };
      const mockResponse = 'some-access-token';
      const httpTestSettings = {
        requestFunction: () => service.getAccessTokenFromAuthorizationCode(authorizationCode),
        responses: [
          {
            body: mockResponse,
          }
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<string>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[0].method).toEqual('POST');
      expect(httpTestResult.requests[0].body).toEqual(requestBodyOracle);
      await expectAsync(httpTestResult.response()).toBeResolvedTo(mockResponse);

    });

    it('should properly exchange a prior access token for a new access token', async () => {

      // Arrange
      const requestUrlOracle = `${defaultMockBackendUrl}/tokens`;
      const priorAccessToken = 'some-prior-access-token';
      const requestBodyOracle = {
        proofType: 'priorAccessToken',
        proof: priorAccessToken
      };
      const mockResponse = 'some-access-token';
      const httpTestSettings = {
        requestFunction: () => service._getAccessTokenFromPriorAccessToken(priorAccessToken),
        responses: [
          {
            body: mockResponse,
          }
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<string>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[0].method).toEqual('POST');
      expect(httpTestResult.requests[0].body).toEqual(requestBodyOracle);
      await expectAsync(httpTestResult.response()).toBeResolvedTo(mockResponse);

    });

    it('should fail to getAccessTokenFromPriorAccessToken if no valid access token is present', async () => {

      // Arrange
      const requestUrlOracle = `${defaultMockBackendUrl}/tokens`;
      const priorAccessToken = 'some-invalid-access-token';
      const mockResponse = `Did not find a matching entry for access token ${priorAccessToken}.`;
      const httpTestSettings = {
        requestFunction: () => service._getAccessTokenFromPriorAccessToken(priorAccessToken),
        responses: [
          {
            body: mockResponse,
            options: {
              status: 404,
              statusText: 'Not Found'
            }
          }
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<string>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toEqual(requestUrlOracle);
      await expectAsync(httpTestResult.response()).toBeRejectedWithError(NoValidCredentialsError);

    });

    it('should fail to getAccessTokenFromPriorAccessToken if an unexpected error occurs', async () => {

      // Arrange
      const requestUrlOracle = `${defaultMockBackendUrl}/tokens`;
      const priorAccessToken = 'some-prior-access-token';
      const httpTestSettings = {
        requestFunction: () => service._getAccessTokenFromPriorAccessToken(priorAccessToken),
        responses: [
          {
            body: 'Internal Server Error',
            options: {
              status: 500,
              statusText: 'Internal Server Error'
            }
          }
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<string>(httpTestSettings);

      //  Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      await expectAsync(httpTestResult.response())
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringMatching(/Http failure response/)
        }));

    });

  });

});
