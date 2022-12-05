import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CodeReceiverComponent } from './components/code-receiver/code-receiver.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AuthenticatorService } from './services/authenticator/authenticator.service';

const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthenticatorService] },
  { path: 'login', component: LoginComponent },
  { path: 'code-receiver', component: CodeReceiverComponent },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
