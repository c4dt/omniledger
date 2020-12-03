import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { DBError } from "../byz-coin.service";

@Component({
    templateUrl: "db-error-dialog.component.html",
})
export class DBErrorDialog {
    static async open(dialog: MatDialog, error: DBError): Promise<void> {
        const ref = dialog.open(DBErrorDialog, { data: error });
        await new Promise((resolve) => ref.afterClosed().subscribe(resolve));
    }

    constructor(@Inject(MAT_DIALOG_DATA) readonly error: DBError) {}
}
