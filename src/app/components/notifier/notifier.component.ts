import { Component, ErrorHandler } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-notifier',
  templateUrl: './notifier.component.html',
  styleUrls: ['./notifier.component.scss']
})
export class NotifierComponent implements ErrorHandler {
  constructor(private _snackBar: MatSnackBar) {}
  handleError(error: any): void {
    console.log('trying to open snackbar...');
    console.log(error.message);
    const errorMessage: string = error.message.match(/(Error: .*)\n/)[1].replace(/\n/, ' ');
    this.openSnackBar(errorMessage);
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, 'Dismiss', {
      duration: 8000,
      panelClass: ['mat-toolbar', 'mat-primary'],
    });
  }
}
