import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';

import { AuthenticatorService } from './authenticator.service';
import { EnvironmentService } from '../environment/environment.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { HttpTester } from 'src/app/test/HttpTester';
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
    const mockResponse = `https://login.eveonline.com/oauth/authorize?response_type=code&redirect_uri=${defaultMockFrontendUrl}/code-receiver&client_id=a0b0fa3fd6ee47af82c9cb8ae3f51595&scope=esi-assets.read_assets.v1%20esi-characterstats.read.v1%20esi-clones.read_clones.v1%20esi-location.read_location.v1%20esi-markets.read_character_orders.v1%20esi-markets.structure_markets.v1%20esi-skills.read_skills.v1%20esi-universe.read_structures.v1%20esi-wallet.read_character_wallet.v1"`;
    const httpTestSettings = {
      requestFunction: () => service.fetchLoginUrl(),
      transactions: [
        {
          response: {
            body: mockResponse,
          }
        }
      ]
    };

    // Act
    const httpTestResults = await httpTester.test<string>(httpTestSettings);

    // Assert
    expect(httpTestResults.requests[0].url).toBe(`${defaultMockBackendUrl}/login-url`);
    expect(httpTestResults.requests[0].params)
      .toEqual(new HttpParams({ fromObject: { 'callback-url': `${defaultMockFrontendUrl}/code-receiver` } }));
    expect(httpTestResults.requests[0].method).toBe('GET');
    expect(httpTestResults.response).toEqual(mockResponse);

  });

  it('should log out properly', () => {
    mockLocalStorageService.setItem('accessToken', 'some-token');
    service.logOut();
    const token = mockLocalStorageService.getItem('accessToken');
    expect(token).toBe(undefined);
    expect(spyRouter.navigate).toHaveBeenCalledWith(['']);
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
      transactions: [
        {
          response: {
            body: mockResponse,
            // options: ,
          }
        }
      ]
    };

    // Act
    const httpTestResults = await httpTester.test<string>(httpTestSettings);

    // Assert
    expect(httpTestResults.requests[0].url).toBe(requestUrlOracle);
    expect(httpTestResults.requests[0].method).toEqual('POST');
    expect(httpTestResults.requests[0].body).toEqual(requestBodyOracle);
    expect(httpTestResults.response).toEqual(mockResponse);

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
      transactions: [
        {
          response: {
            body: mockResponse,
          }
        }
      ]
    };

    // Act
    const httpTestResults = await httpTester.test<string>(httpTestSettings);

    // Assert
    expect(httpTestResults.requests[0].url).toBe(requestUrlOracle);
    expect(httpTestResults.requests[0].method).toEqual('POST');
    expect(httpTestResults.requests[0].body).toEqual(requestBodyOracle);
    expect(httpTestResults.response).toEqual(mockResponse);

  });

  it('should fail to getAccessTokenFromPriorAccessToken if no valid access token is present', async () => {

    // Arrange
    const requestUrlOracle = `${defaultMockBackendUrl}/tokens`;
    const priorAccessToken = 'some-invalid-access-token';
    const mockResponse = `Did not find a matching entry for access token ${priorAccessToken}.`;
    const httpTestSettings = {
      requestFunction: () => service._getAccessTokenFromPriorAccessToken(priorAccessToken),
      transactions: [
        {
          request: {
            urlOracle: requestUrlOracle
          },
          response: {
            body: mockResponse,
            options: {
              status: 404,
              statusText: 'Not Found'
            }
          }
        }
      ]
    };

    // Act and Assert
    await expectAsync(httpTester.test<string>(httpTestSettings))
      .toBeRejectedWithError(NoValidCredentialsError);

  });

  it('should fail to getAccessTokenFromPriorAccessToken if an unexpected error occurs', async () => {

    // Arrange
    const requestUrlOracle = `${defaultMockBackendUrl}/tokens`;
    const priorAccessToken = 'some-prior-access-token';
    const httpTestSettings = {
      requestFunction: () => service._getAccessTokenFromPriorAccessToken(priorAccessToken),
      transactions: [
        {
          request: {
            urlOracle: requestUrlOracle
          },
          response: {
            body: 'Internal Server Error',
            options: {
              status: 500,
              statusText: 'Internal Server Error'
            }
          }
        }
      ]
    };

    // Act and Assert
    await expectAsync(httpTester.test<string>(httpTestSettings))
      .toBeRejectedWith(jasmine.objectContaining({ message: jasmine.stringMatching(/Http failure response/) }));

  });

  it('should throw an error from requestWithAuth if no access token is present', async () => {

    // Assert and Act
    await expectAsync(service.requestWithAuth(
      'get',
      'https://login.eveonline.com/oauth/verify'
    ))
      .toBeRejectedWithError(NoValidCredentialsError);

  });

  it('should log out during requestWithAuth if no access token is present', async () => {

    // Arrange
    const logOutSpy = spyOn(service, 'logOut');

    // Assert and Act
    await expectAsync(service.requestWithAuth(
      'get',
      'https://login.eveonline.com/oauth/verify'
    ))
      .toBeRejectedWithError(NoValidCredentialsError);

    // Assert
    expect(logOutSpy).toHaveBeenCalled();

  });

  it('should throw an error from requestWithAuth if access token is present but invalid', async () => {

    // Arrange
    const requestUrlOracle = 'https://login.eveonline.com/oauth/verify';
    const priorAccessToken = 'some-invalid-access-token';
    mockLocalStorageService.setItem('accessToken', priorAccessToken);
    const httpTestSettings = {
      requestFunction: () => service.requestWithAuth(
        'get',
        'https://login.eveonline.com/oauth/verify'
      ),
      transactions: [
        {
          request: {
            urlOracle: requestUrlOracle
          },
          response: {
            body: 'The provided access token has expired',
            options: {
              status: 401,
              statusText: 'Unauthorized'
            }
          }
        },
        {
          request: {
            urlOracle: `${defaultMockBackendUrl}/tokens`
          },
          response: {
            body: `Did not find a matching entry for access token ${priorAccessToken}.`,
            options: {
              status: 404,
              statusText: 'Not Found'
            }
          }
        },
      ]
    };

    // Act and Assert
    await expectAsync(httpTester.test<HttpResponse<object>>(httpTestSettings))
      .toBeRejectedWithError(NoValidCredentialsError);

  });

  it('should log out during requestWithAuth if access token is present but invalid', async () => {

    // Arrange
    const priorAccessToken = 'some-invalid-access-token';
    mockLocalStorageService.setItem('accessToken', priorAccessToken);
    const logOutSpy = spyOn(service, 'logOut');
    const httpTestSettings = {
      requestFunction: () => service.requestWithAuth(
        'get',
        'https://login.eveonline.com/oauth/verify'
      ),
      transactions: [
        {
          request: {
            urlOracle: 'https://login.eveonline.com/oauth/verify',
          },
          response: {
            body: 'The provided access token has expired',
            options: {
              status: 401,
              statusText: 'Unauthorized'
            }
          }
        },
        {
          request: {
            urlOracle: `${defaultMockBackendUrl}/tokens`
          },
          response: {
            body: `Did not find a matching entry for access token ${priorAccessToken}.`,
            options: {
              status: 404,
              statusText: 'Not Found'
            }
          }
        }
      ]
    };

    // Act
    await expectAsync(httpTester.test<HttpResponse<Object>>(httpTestSettings))
      .toBeRejectedWithError(NoValidCredentialsError);

    expect(logOutSpy).toHaveBeenCalled();

  });

  it('should use the intended HTTP method for requests with auth', async () => {

    // Arrange
    const requestUrlOracle = 'https://login.eveonline.com/oauth/verify';
    const mockAccessToken = 'some-access-token';
    mockLocalStorageService.setItem('accessToken', mockAccessToken);
    const mockResponse = { data: 'some-fake-data' };
    const httpTestSettings = {
      requestFunction: () => service.requestWithAuth(
        'get',
        'https://login.eveonline.com/oauth/verify'
      ),
      transactions: [
        {
          request: {
            urlOracle: requestUrlOracle,
          },
          response: {
            body: mockResponse
          }
        }
      ]
    };

    // Act
    const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

    // Assert
    expect(httpTestResult.requests[0].method).toEqual('GET');

  });

  it('should properly add the authorization header for requests with auth', async () => {

    // Arrange
    const requestUrlOracle = 'https://login.eveonline.com/oauth/verify';
    const mockAccessToken = 'some-access-token';
    mockLocalStorageService.setItem('accessToken', mockAccessToken);
    const mockResponse = { data: 'some-fake-data' };
    const httpTestSettings = {
      requestFunction: () => service.requestWithAuth(
        'get',
        'https://login.eveonline.com/oauth/verify'
      ),
      transactions: [
        {
          request: {
            urlOracle: requestUrlOracle,
          },
          response: {
            body: mockResponse
          }
        }
      ]
    };

    // Act
    const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

    // Assert
    expect(httpTestResult.requests[0].headers.get('authorization'))
      .toEqual(`Bearer ${mockAccessToken}`);

  });

  it('should properly pass query parameters of requests with auth', async () => {

    // Arrange
    const requestUrlOracle = 'https://login.eveonline.com/oauth/verify?type_id=56';
    const mockAccessToken = 'some-access-token';
    mockLocalStorageService.setItem('accessToken', mockAccessToken);
    const requestParamsOracle = {
      type_id: '56',
    };
    const mockResponse = { data: 'some-fake-data' };
    const httpTestSettings = {
      requestFunction: () => service.requestWithAuth(
        'get',
        'https://login.eveonline.com/oauth/verify',
        { params: requestParamsOracle }
      ),
      transactions: [
        {
          request: {
            urlOracle: requestUrlOracle,
          },
          response: {
            body: mockResponse
          }
        }
      ]
    };

    // Act
    const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

    // Assert
    expect(httpTestResult.requests[0].params)
      .toEqual(new HttpParams({ fromObject: requestParamsOracle }));

  });

  it('should properly pass the body of requests with auth', async () => {

    // Arrange
    const requestUrlOracle = 'https://login.eveonline.com/oauth/verify';
    const mockAccessToken = 'some-access-token';
    mockLocalStorageService.setItem('accessToken', mockAccessToken);
    const requestBodyOracle = {
      type_id: 56,
    };
    const mockResponse = { data: 'some-fake-data' };
    const httpTestSettings = {
      requestFunction: () => service.requestWithAuth(
        'get',
        'https://login.eveonline.com/oauth/verify',
        { body: requestBodyOracle }
      ),
      transactions: [
        {
          request: {
            urlOracle: requestUrlOracle,
          },
          response: {
            body: mockResponse
          }
        }
      ]
    };

    // Act
    const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

    // Assert
    expect(httpTestResult.requests[0].body).toEqual(requestBodyOracle);

  });

  it('should properly return the response of requests with auth', async () => {

    // Arrange
    const requestUrlOracle = 'https://login.eveonline.com/oauth/verify';
    const mockAccessToken = 'some-access-token';
    mockLocalStorageService.setItem('accessToken', mockAccessToken);
    const mockResponse = { data: 'some-fake-data' };
    const httpTestSettings = {
      requestFunction: () => service.requestWithAuth(
        'get',
        'https://login.eveonline.com/oauth/verify'
      ),
      transactions: [
        {
          request: {
            urlOracle: requestUrlOracle,
          },
          response: {
            body: mockResponse
          }
        }
      ]
    };

    // Act
    const httpTestResult = await httpTester.test<HttpResponse<Object>>(httpTestSettings);

    // Assert
    expect(httpTestResult.response.body).toEqual(mockResponse);

  });

});
