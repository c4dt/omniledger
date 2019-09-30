import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import Log from "@c4dt/cothority/log";
import { Data, TProgress } from "@c4dt/dynacred";
import { DialogTransactionComponent } from "./dialog-transaction";

/**
 * Shows a simple snack-message at the bottom of the screen. The message is informative
 * only and be cancelled by the user.
 *
 * @param snack reference to the MatSnackBar
 * @param text the text to show
 * @param cmd an eventual command to run - if an error occurs, it will be shown in a red snackBar
 */
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

/**
 * Shows a simple dialog with an OK and a Cancel button. The return value of the
 * method is a boolean: true for OK and false for Cancel.
 *
 * @param dialog reference to the matDialog
 * @param title shown in h1 in the dialog
 * @param text the text in HTML
 * @param buttons can override the text of the OKButton ("OK") or the CancelButton ("Cancel")
 */
export async function showDialogOKC(dialog: MatDialog, title: string, text: string,
                                    buttons: IDialogOKCButtons = {OKButton: "OK", CancelButton: "Cancel"}):
    Promise<boolean> {
    const tc = dialog.open(DialogOKCancelComponent, {data: {Title: title, Text: text, Buttons: buttons}});
    return new Promise((resolve) => tc.afterClosed().subscribe((result) => resolve(result)));
}

/**
 * Shows a simple dialog with a dismiss button and returns when the user presse the dismiss button.
 *
 * @param dialog reference to the matDialog
 * @param title shown in h1 in the dialog
 * @param text the text in HTML
 * @param dismiss the string to be shown in the dismiss button
 */
export async function showDialogInfo(dialog: MatDialog, title: string, text: string,
                                     dismiss: string) {
    const tc = dialog.open(DialogOKCancelComponent, {
        data: {
            Buttons: {OKButton: dismiss, CancelButton: ""},
            Text: text,
            Title: title,
        },
    });
    return new Promise((resolve) => tc.afterClosed().subscribe(() => resolve()));
}

/**
 * Convenience method for showTransactions that only shows one progress step: "Storing Credential".
 *
 * @param dialog reference to the matDialog
 * @param title shown in h1 in the dialog
 * @param store the callback to the actual storing of the credential.
 */
export async function storeCredential(dialog: MatDialog, title: string, uData: Data) {
    return showTransactions(dialog, title, async (progress: TProgress) => {
        progress(50, "Storing Credential");
        await uData.save();
    });
}

// Worker callback that implements multiple steps and calls progress before each step.
export type TWorker<T> = (progress: TProgress) => Promise<T>;

/**
 * Shows a nice pop-up with some animation of the blockchain and the transaction being processed.
 * The worker callback can store anything and call progress as many times as it wants. Every time
 * progress is called, the progress-bar is updated and the text is shown as a transaction (for positive
 * percentage values) or as a text in the progress-bar (for negative percentage values).
 *
 * When the percentage value reaches +-100, the window will be closed.
 *
 * If an error occurs, the promise will be rejected.
 *
 * The type of the returned promise is the type returned by the worker callback.
 *
 * @param dialog reference to MatDialog
 * @param title shown in h1 in the dialog
 * @param worker the callback that will execute the one or more transactions
 */
export async function showTransactions<T>(dialog: MatDialog, title: string, worker: TWorker<T>): Promise<T> {
    const tc = dialog.open(DialogTransactionComponent, {
        data: {
            title,
            worker,
        },
        disableClose: true,
    });

    return new Promise((resolve, reject) => {
        tc.afterClosed().subscribe({
            error: reject,
            next: (v) => {
                if (v instanceof Error) {
                    reject(v);
                } else {
                    resolve(v);
                }
            },
        });
    });
}

/**
 * Split hex-value in separate blocks.
 *
 * @param buf the buffer to display
 * @param group the size of the blocks - default: 16
 */
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
