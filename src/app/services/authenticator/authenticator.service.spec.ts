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

  describe('eveRequest', () => {

    let requestMethodOracle: string;
    let requestUrlOracle: string;
    let requestParamsOracle: any;
    let requestBodyOracle: any;
    let priorAccessToken: string;
    let responseBodyOracle: any;
    let httpTestSettings: HttpTestSettings<any>;

    beforeEach(() => {

      // Set happy defaults
      requestMethodOracle = 'get';
      requestUrlOracle = 'https://api.iskprinter.com/tokens';
      requestParamsOracle = {
        user: 'some-user',
      };
      requestBodyOracle = {
        type_id: 56,
      };
      priorAccessToken = 'some-access-token';
      mockLocalStorageService.setItem('accessToken', priorAccessToken);
      responseBodyOracle = { data: 'some-fake-data' };
      httpTestSettings = {
        requestFunction: () => service.eveRequest<any>(
          requestMethodOracle,
          requestUrlOracle,
          {
            body: requestBodyOracle,
            params: requestParamsOracle
          }
        ),
        responses: [
          {
            body: responseBodyOracle,
          }
        ]
      };

    });

    it('should use the intended HTTP method for requests with auth', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].method.toLowerCase()).toEqual(requestMethodOracle.toLowerCase());
      expect(httpTestResult.requests[0].url).toEqual(requestUrlOracle);

    });

    it('should properly add the authorization header for requests with auth', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[0].headers.get('authorization'))
        .toEqual(`Bearer ${priorAccessToken}`);

    });

    it('should properly pass query parameters of requests with auth', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[0].params)
        .toEqual(new HttpParams({ fromObject: requestParamsOracle }));

    });

    it('should properly pass the body of requests with auth', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toEqual(requestUrlOracle);
      expect(httpTestResult.requests[0].body).toEqual(requestBodyOracle);

    });

    it('should properly return the response of requests with auth', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      await expectAsync(httpTestResult.response())
        .toBeResolvedTo(jasmine.objectContaining({ body: responseBodyOracle }));

    });

    it('should throw an error from eveRequest if no access token is present', async () => {

      // Arrange
      mockLocalStorageService.clear();

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Assert
      await expectAsync(httpTestResult.response()).toBeRejectedWithError(NoValidCredentialsError);

    });

    it('should log out during eveRequest if no access token is present', async () => {

      // Arrange
      mockLocalStorageService.clear();
      const logOutSpy = spyOn(service, 'logOut');

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Assert
      expect(logOutSpy).toHaveBeenCalled();
      await expectAsync(httpTestResult.response()).toBeRejectedWithError(NoValidCredentialsError);

    });

    it('should throw an error from eveRequest if access token is present but invalid', async () => {

      // Arrange
      const httpTestSettings = {
        requestFunction: () => service.eveRequest<any>(
          requestMethodOracle,
          requestUrlOracle
        ),
        responses: [
          {
            body: 'The provided access token has expired',
            options: {
              status: 401,
              statusText: 'Unauthorized'
            }
          },
          {
            body: `Did not find a matching entry for access token ${priorAccessToken}.`,
            options: {
              status: 404,
              statusText: 'Not Found'
            }
          },
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[1].url).toBe(`${defaultMockBackendUrl}/tokens`);
      await expectAsync(httpTestResult.response()).toBeRejectedWithError(NoValidCredentialsError);

    });

    it('should log out during eveRequest if access token is present but invalid', async () => {

      // Arrange
      const logOutSpy = spyOn(service, 'logOut');
      const httpTestSettings = {
        requestFunction: () => service.eveRequest<any>(
          requestMethodOracle,
          requestUrlOracle
        ),
        responses: [
          {
            body: 'The provided access token has expired',
            options: {
              status: 401,
              statusText: 'Unauthorized'
            }
          },
          {
            body: `Did not find a matching entry for access token ${priorAccessToken}.`,
            options: {
              status: 404,
              statusText: 'Not Found'
            }
          }
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Act
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[1].url).toBe(`${defaultMockBackendUrl}/tokens`);
      await expectAsync(httpTestResult.response()).toBeRejectedWithError(NoValidCredentialsError);
      expect(logOutSpy).toHaveBeenCalled();

    });

    it('should throw an error if the Eve API responses with a non-401/403 error', async () => {

      // Arrange
      const httpTestSettings = {
        requestFunction: () => service.eveRequest<any>(
          requestMethodOracle,
          requestUrlOracle
        ),
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
      const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

      // Assert
      await expectAsync(httpTestResult.response())
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringMatching(/Internal Server Error/)
        }));
    });

    it('should be able to recover and from an expired token and complete the request', async () => {

      // Arrange
      const httpTestSettings = {
        requestFunction: () => service.eveRequest<any>(
          requestMethodOracle,
          requestUrlOracle
        ),
        responses: [
          {
            body: 'The provided access token has expired',
            options: {
              status: 401,
              statusText: 'Unauthorized'
            }
          },
          {
            body: 'new-access-token',
          },
          {
            body: responseBodyOracle,
          },
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[1].url).toBe(`${defaultMockBackendUrl}/tokens`);
      expect(httpTestResult.requests[2].url).toBe(requestUrlOracle);
      await expectAsync(httpTestResult.response())
        .toBeResolvedTo(jasmine.objectContaining({
          body: responseBodyOracle
        }));

    });

    it('should throw an error if a new token is requested but the backend responds with a non-404 error', async () => {

      // Arrange
      const httpTestSettings = {
        requestFunction: () => service.eveRequest<any>(
          requestMethodOracle,
          requestUrlOracle
        ),
        responses: [
          {
            body: 'The provided access token has expired',
            options: {
              status: 401,
              statusText: 'Unauthorized'
            }
          },
          {
            body: 'Forbidden',
            options: {
              status: 403,
              statusText: 'Forbidden'
            }
          },
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Assert
      await expectAsync(httpTestResult.response())
        .toBeRejectedWith(jasmine.objectContaining({
          message: jasmine.stringMatching(/Forbidden/)
        }));

    });

    it('should be able to try up to 3 times from an absent CORS header', async () => {

      /* Example error:
      {
        error: ProgressEvent { isTrusted: true, lengthComputable: false, loaded: 0, total: 0, type: "error", … }
        headers: zf { normalizedNames: Map(0), lazyUpdate: null, headers: Map(0) }
        message: "Http failure response for https://esi.evetech.net/latest/markets/10000060/history: 0 Unknown Error"
        name: "HttpErrorResponse"
        ok: false
        status: 0
        statusText: "Unknown Error"
        url: "https://esi.evetech.net/latest/markets/10000060/history"
      }
      */

      // Arrange
      const httpTestSettings = {
        requestFunction: () => service.eveRequest<any>(
          requestMethodOracle,
          requestUrlOracle
        ),
        responses: [
          {
            body: `Http failure response for ${requestUrlOracle}: 0 Unknown Error`,
            options: {
              status: 0,
              statusText: 'Unknown Error'
            }
          },
          {
            body: `Http failure response for ${requestUrlOracle}: 0 Unknown Error`,
            options: {
              status: 0,
              statusText: 'Unknown Error'
            }
          },
          {
            body: responseBodyOracle
          }
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[1].url).toBe(requestUrlOracle);
      expect(httpTestResult.requests[2].url).toBe(requestUrlOracle);
      await expectAsync(httpTestResult.response())
        .toBeResolvedTo(jasmine.objectContaining({
          body: responseBodyOracle
        }));

    });

  });

  describe('backendRequest', () => {

    let requestMethodOracle: string;
    let requestUrlOracle: string;
    let requestPathOracle: string;
    let priorAccessToken: string;
    let requestHeadersOracle: any;
    let requestBodyOracle: any;
    let requestParamsOracle: any;
    let responseBodyOracle: any;
    let httpTestSettings: HttpTestSettings<any>;

    beforeEach(() => {

      // Set happy defaults
      requestMethodOracle = 'get';
      requestUrlOracle = defaultMockBackendUrl;
      requestPathOracle = '/some-path';
      priorAccessToken = 'some-access-token';
      mockLocalStorageService.setItem('accessToken', priorAccessToken);
      requestHeadersOracle = {
        'content-type': 'application/json'
      }
      requestParamsOracle = {
        user: 'some-user-id'
      };
      requestBodyOracle = {
        user: 'some-user-id'
      };
      responseBodyOracle = 'some-data';
      httpTestSettings = {
        requestFunction: () => service.backendRequest(
          requestMethodOracle,
          requestPathOracle,
          {
            headers: requestHeadersOracle,
            body: requestBodyOracle,
            params: requestParamsOracle
          }
        ),
        responses: [
          {
            body: responseBodyOracle,
          }
        ]
      };

    });

    it('should send the request to the proper address', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].url).toBe(`${requestUrlOracle}${requestPathOracle}`);
      await expectAsync(httpTestResult.response())
        .toBeResolvedTo(jasmine.objectContaining({
          body: responseBodyOracle
        }));

    });

    it('should properly pass the request body', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].body).toEqual(requestBodyOracle);
      await expectAsync(httpTestResult.response())
        .toBeResolvedTo(jasmine.objectContaining({
          body: responseBodyOracle
        }));

    });

    it('should properly pass headers parameters', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Assert
      const exampleHeaderKey = Object.keys(requestHeadersOracle)[0];
      const exampleHeaderValue = requestHeadersOracle[exampleHeaderKey];
      expect(httpTestResult.requests[0].headers.get(exampleHeaderKey)).toEqual(exampleHeaderValue);

    });

    it('should properly pass url parameters', async () => {

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Assert
      expect(httpTestResult.requests[0].params).toEqual(new HttpParams({
        fromObject: requestParamsOracle
      }));

    });

    it('should not require request headers, params, or body', async () => {

      // Arrange
      httpTestSettings = {
        requestFunction: () => service.backendRequest(
          requestMethodOracle,
          requestPathOracle,
        ),
        responses: [
          {
            body: responseBodyOracle,
          }
        ]
      };

      // Act
      const httpTestResult = await httpTester.test<HttpResponse<object>>(httpTestSettings);

      // Asserts
      await expectAsync(httpTestResult.response())
        .toBeResolvedTo(jasmine.objectContaining({
          body: responseBodyOracle
        }));

    });

  });

});
