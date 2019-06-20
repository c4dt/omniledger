import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import Log from "@dedis/cothority/log";

export async function showSnack(snack: MatSnackBar, text: string, cmd: () => void) {
    let sb = snack.open(text);
    let err: Error;
    try {
        await cmd();
    } catch (e) {
        err = e;
    } finally {
        sb.dismiss();
    }
    if (err) {
        Log.error(err);
        // sb = snack.open("Error: " + text);
        sb = snack.open("Error: " + err.toString(), "", {
            duration: 3000,
            panelClass: "redBack",
        });
    }
}

export async function showDialogOKC(dialog: MatDialog, title: string, text: string,
                                    result: (result: boolean) => void,
                                    buttons: IDialogButtons = {OKButton: "OK", CancelButton: "Cancel"}) {
    const tc = dialog.open(DialogOKCancelComponent, {data: {Title: title, Text: text, Buttons: buttons}});
    tc.afterClosed().subscribe(result);
}

export async function showDialogInfo(dialog: MatDialog, title: string, text: string,
                                     dismiss: string,
                                     result: (result: boolean) => void = null) {
    const tc = dialog.open(DialogOKCancelComponent, {
        data: {
            Buttons: {OKButton: dismiss, CancelButton: ""},
            Text: text,
            Title: title,
        },
    });
    tc.afterClosed().subscribe((res) => {
        if (result) {
            result(res);
        }
    });
}

export function hexBuffer(buf: Buffer, group: number = 16): string {
    let hex = buf.toString("hex");
    for (let pos = group; pos < hex.length; pos += group + 1) {
        hex = hex.substring(0, pos) + " " + hex.substring(pos);
    }
    return hex;
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
