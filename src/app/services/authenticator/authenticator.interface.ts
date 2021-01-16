import { HttpResponse } from '@angular/common/http';

export interface AuthenticatorInterface {
    requestWithAuth<R>(method: string, url: string, options?: any): Promise<HttpResponse<R>>;
    backendRequest(method: string, url: string, options?: any): Promise<HttpResponse<Object>>;
}
