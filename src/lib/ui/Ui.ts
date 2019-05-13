import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";

export async function showSnack(snack: MatSnackBar, text: string, cmd: () => void ) {
    const sb = snack.open(text);
    try {
        await cmd();
    } finally {
        sb.dismiss();
    }
}

export async function showDialogOKC(dialog: MatDialog, title: string, text: string,
                                    result: (result: boolean) => void,
                                    buttons: IDialogButtons = {OKButton: "OK", CancelButton: "Cancel"}) {
    const tc = dialog.open(DialogOKCancelComponent, {data: {Title: title, Text: text, Buttons: buttons}});
    tc.afterClosed().subscribe(result);
}

export interface IDialogButtons {
    OKButton: string;
    CancelButton: string;
}

export interface IDialogConfig {
    Title: string;
    Text: string;
    Buttons: IDialogButtons;
}

@Component({
    selector: "app-dialog-okcancel",
    templateUrl: "dialog-okcancel.html",
})
export class DialogOKCancelComponent {
    constructor(
        public dialogRef: MatDialogRef<DialogOKCancelComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IDialogConfig) {
    }
}
