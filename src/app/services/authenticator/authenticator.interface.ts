import { Observable } from 'rxjs';

export interface AuthenticatorInterface {
    eveRequest<R>(method: string, url: string, options?: any): Observable<R>;
}
