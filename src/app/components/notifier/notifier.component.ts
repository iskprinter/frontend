import { Component, ErrorHandler, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-notifier',
  templateUrl: './notifier.component.html',
  styleUrls: ['./notifier.component.scss']
})
export class NotifierComponent implements ErrorHandler {
  constructor(
    private ngZone: NgZone,
    private _snackBar: MatSnackBar
  ) { }
  handleError(error: any): void {
    const errorMessages: string = error.message.match(/(Error: .*)\n/);
    if (errorMessages && errorMessages.length > 0) {
      this.openSnackBar(errorMessages[1].replace(/\n/, ' '))
    } else {
      this.openSnackBar(error.message);
    }
  }

  openSnackBar(message: string) {
    this.ngZone.run(() => {
      setTimeout(
        () => {
          this._snackBar.open(message, 'Dismiss', {
            duration: 8000,
            panelClass: ['mat-toolbar', 'mat-primary'],
          })
        }, 0);
    })
  }
}
