import { BrowserModule, Title } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

/* Begin Material setup, per https://material.angular.io/guide/getting-started */
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTreeModule } from '@angular/material/tree';
/* End Material setup */

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RequestThrottlerModule } from 'src/app/modules/request-throttler/request-throttler.module';

import { CodeReceiverComponent } from './components/code-receiver/code-receiver.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { LoginComponent } from 'src/app/components/login/login.component';
import { NavComponent } from 'src/app/components/nav/nav.component';
import { PageNotFoundComponent } from 'src/app/components/page-not-found/page-not-found.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { StationTradingComponent } from './components/station-trading/station-trading.component';
import { NotifierComponent } from './components/notifier/notifier.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  declarations: [
    AppComponent,
    CodeReceiverComponent,
    DashboardComponent,
    LoginComponent,
    NavComponent,
    PageNotFoundComponent,
    ProfileComponent,
    SidenavComponent,
    StationTradingComponent,
    NotifierComponent,
  ],
  imports: [
    AppRoutingModule,

    /* Begin Material setup */
    BrowserModule, // Must be imported before any Mat*Module module.
    LayoutModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatGridListModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatToolbarModule,
    MatTreeModule,
    /* End Material setup */

    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    RequestThrottlerModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
    { provide: ErrorHandler, useClass: NotifierComponent },
    Title,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
