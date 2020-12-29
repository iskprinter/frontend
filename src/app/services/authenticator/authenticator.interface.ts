import { HttpResponse } from '@angular/common/http';

export interface AuthenticatorInterface {
    requestWithAuth(method: string, url: string, options?: any): Promise<HttpResponse<Object>>;
    backendRequest(method: string, url: string, options?: any): Promise<HttpResponse<Object>>;
}
