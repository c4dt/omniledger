import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import Log from "@dedis/cothority/log";
import { DialogTransactionComponent } from "./dialog-transaction";

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
        throw new Error(err.toString());
    }
}

export async function showDialogOKC(dialog: MatDialog, title: string, text: string,
                                    result: (result: boolean) => void,
                                    buttons: IDialogOKCButtons = {OKButton: "OK", CancelButton: "Cancel"}) {
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

export async function storeCredential(dialog: MatDialog, title: string,
                                      store: () => Promise<void>) {
    return showTransactions(dialog, title, async (progress: TProgress) => {
        progress(50, "Storing Credential");
        await store();
    });
}

export type TProgress = (percentage: number, text: string) => void;
export type TWorker = (progress: TProgress) => Promise<void>;

export async function showTransactions(dialog: MatDialog, title: string, worker: TWorker): Promise<string> {
    const tc = dialog.open(DialogTransactionComponent, {
        data: {
            title,
            worker,
        },
        disableClose: true,
    });

    return new Promise((resolve) => {
        tc.afterClosed().subscribe((res) => {
            resolve(res);
        });
    });
}

export function hexBuffer(buf: Buffer, group: number = 16): string {
    let hex = buf.toString("hex");
    for (let pos = group; pos < hex.length; pos += group + 1) {
        hex = hex.substring(0, pos) + " " + hex.substring(pos);
    }
    return hex;
}

export interface IDialogOKCButtons {
    OKButton: string;
    CancelButton: string;
}

export interface IDialogOKCConfig {
    Title: string;
    Text: string;
    Buttons: IDialogOKCButtons;
}

@Component({
    selector: "app-dialog-okcancel",
    templateUrl: "dialog-okcancel.html",
})
export class DialogOKCancelComponent {
    constructor(
        public dialogRef: MatDialogRef<DialogOKCancelComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IDialogOKCConfig) {
    }
}
