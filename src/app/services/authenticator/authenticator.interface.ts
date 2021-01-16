import { HttpResponse } from '@angular/common/http';

export interface AuthenticatorInterface {
    eveRequest<R>(method: string, url: string, options?: any): Promise<HttpResponse<R>>;
    backendRequest<R>(method: string, url: string, options?: any): Promise<HttpResponse<R>>;
}
