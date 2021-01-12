import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestBed } from '@angular/core/testing';

import { AuthenticatorService } from './authenticator.service';
import { EnvironmentService } from '../environment/environment.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { HttpTester, blockUntilRequestReceived } from 'src/app/test/HttpTester';
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
          request: {
            methodOracle: 'GET',
            urlOracle: `${defaultMockBackendUrl}/login-url?callback-url=${defaultMockFrontendUrl}/code-receiver`,
          },
          response: {
            body: mockResponse,
          }
        }
      ]
    };

    // Act
    const loginUrl = await httpTester.test<string>(httpTestSettings);

    // Assert
    expect(loginUrl).toEqual(mockResponse);

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
          request: {
            methodOracle: 'POST',
            urlOracle: requestUrlOracle,
            bodyOracle: requestBodyOracle
          },
          response: {
            body: mockResponse,
            // options: ,
          }
        }
      ]
    };

    // Act
    const accessToken = await httpTester.test<string>(httpTestSettings);

    // Assert
    expect(accessToken).toEqual(mockResponse);
    // expect(req.request.body).toEqual(requestBodyOracle);

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
    
    // Act
    const pendingRequest = service._getAccessTokenFromPriorAccessToken(priorAccessToken);
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestUrlOracle);
    req.flush(mockResponse);
    const accessToken = await pendingRequest;

    // Assert
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(requestBodyOracle);
    expect(accessToken).toEqual(mockResponse);

  });

  it('should fail to getAccessTokenFromPriorAccessToken if no valid access token is present', async () => {

    // Arrange
    const requestUrlOracle = `${defaultMockBackendUrl}/tokens`;
    const priorAccessToken = 'some-invalid-access-token';
    const mockResponse = `Did not find a matching entry for access token ${priorAccessToken}.`;
    const logOutSpy = spyOn(service, 'logOut');

    // Act
    const pendingExpectation = expectAsync(service._getAccessTokenFromPriorAccessToken(priorAccessToken))
      .toBeRejectedWithError(NoValidCredentialsError);
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestUrlOracle);
    req.flush(
      mockResponse,
      {
        status: 404,
        statusText: 'Not Found'
      }
    );
    await pendingExpectation;

  });

  it('should fail to getAccessTokenFromPriorAccessToken if an unexpected error occurs', async () => {

    // Arrange
    const requestUrlOracle = `${defaultMockBackendUrl}/tokens`;
    const priorAccessToken = 'some-prior-access-token';

    // Assert and Act
    const pendingExpectation = expectAsync(service._getAccessTokenFromPriorAccessToken(priorAccessToken))
      .toBeRejectedWith(jasmine.objectContaining({ message: jasmine.stringMatching(/Http failure response/) }));
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestUrlOracle);
    req.flush(
      'Internal Server Error',
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );
    await pendingExpectation;

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

    // Act and Assert
    const pendingExpectation = expectAsync(
      service.requestWithAuth(
        'get',
        'https://login.eveonline.com/oauth/verify'
      )
    )
      .toBeRejectedWithError(NoValidCredentialsError);

    await blockUntilRequestReceived(httpTestingController);
    const req1 = httpTestingController.expectOne(requestUrlOracle);
    req1.flush(
      'The provided access token has expired',
      {
        status: 401,
        statusText: 'Unauthorized'
      }
    );

    await blockUntilRequestReceived(httpTestingController);
    const req2 = httpTestingController.expectOne(`${defaultMockBackendUrl}/tokens`);
    req2.flush(
      `Did not find a matching entry for access token ${priorAccessToken}.`,
      {
        status: 404,
        statusText: 'Not Found'
      }
    );
    await pendingExpectation;

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
            methodOracle: 'GET',
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
            methodOracle: 'POST',
            urlOracle: `${defaultMockBackendUrl}/tokens`,
            bodyOracle: {
              proofType: 'priorAccessToken',
              proof: 'some-invalid-access-token'
            }
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

    // Act
    const pendingRequest = service.requestWithAuth(
      'get',
      'https://login.eveonline.com/oauth/verify'
    );
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestUrlOracle);
    req.flush(mockResponse);
    await pendingRequest;

    // Assert
    expect(req.request.method).toEqual('GET');

  });

  it('should properly add the authorization header for requests with auth', async () => {

    // Arrange
    const requestUrlOracle = 'https://login.eveonline.com/oauth/verify';
    const mockAccessToken = 'some-access-token';
    mockLocalStorageService.setItem('accessToken', mockAccessToken);
    const mockResponse = { data: 'some-fake-data' };

    // Act
    const pendingRequest = service.requestWithAuth(
      'get',
      'https://login.eveonline.com/oauth/verify'
    );
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestUrlOracle);
    req.flush(mockResponse);
    await pendingRequest;

    // Assert
    expect(req.request.headers.get('authorization')).toEqual(`Bearer ${mockAccessToken}`);

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

    // Act
    const pendingRequest = service.requestWithAuth(
      'get',
      'https://login.eveonline.com/oauth/verify',
      { params: requestParamsOracle }
    );
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestUrlOracle); // Assert
    req.flush(mockResponse);
    await pendingRequest;

    // Assert
    expect(req.request.params).toEqual(new HttpParams({ fromObject: requestParamsOracle }));

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

    // Act
    const pendingRequest = service.requestWithAuth(
      'get',
      'https://login.eveonline.com/oauth/verify',
      { body: requestBodyOracle }
    );
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestUrlOracle); // Assert
    req.flush(mockResponse);
    await pendingRequest;

    // Assert
    expect(req.request.body).toEqual(requestBodyOracle);

  });

  it('should properly return the response of requests with auth', async () => {

    // Arrange
    const requestUrlOracle = 'https://login.eveonline.com/oauth/verify';
    const mockAccessToken = 'some-access-token';
    mockLocalStorageService.setItem('accessToken', mockAccessToken);
    const mockResponse = { data: 'some-fake-data' };

    // Act
    const pendingRequest = service.requestWithAuth(
      'get',
      'https://login.eveonline.com/oauth/verify'
    );
    await blockUntilRequestReceived(httpTestingController);
    const req = httpTestingController.expectOne(requestUrlOracle);
    req.flush(mockResponse);
    const response = await pendingRequest;

    // Assert
    expect(response.body).toEqual(mockResponse);

  });

});
