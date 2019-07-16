import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material";
import { Router } from "@angular/router";

import Log from "@dedis/cothority/log";

import { Defaults } from "@c4dt/dynacred/Defaults";

import { BcviewerService } from "./bcviewer/bcviewer.component";
import { UserData } from "./user-data.service";

@Component({
    selector: "app-root",
    styleUrls: ["./app.component.css"],
    templateUrl: "./app.component.html",
})

export class AppComponent implements OnInit {
    loading = true;

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private bcs: BcviewerService,
        private uData: UserData,
    ) {
    }

    async ngOnInit() {
        if (window.location.pathname.match(/\/register(\/device)?/)) {
            Log.lvl2("allowing registering with unknown Data");
            this.loading = false;
            return;
        }

        try {
            await this.uData.load();
            this.loading = false;
            this.bcs.updateBlocks();
        } catch (e) {
            if (!this.uData.constructorObj) {
                // No data saved - show how to get a new user
                this.loading = false;
                await this.router.navigate(["/newuser"]);
            } else {
                // Data was here, but loading failed afterward - might be a network failure.
                const fileDialog = this.dialog.open(RetryLoadComponent, {
                    width: "300px",
                });
                fileDialog.afterClosed().subscribe(async (result: boolean) => {
                    if (result) {
                        window.location.reload();
                    } else {
                        this.loading = false;
                        await this.router.navigate(["/newuser"]);
                    }
                });
            }
        }
    }
}

@Component({
    selector: "app-retry-load",
    templateUrl: "retry-load.html",
})
export class RetryLoadComponent {
    constructor(
        public dialogRef: MatDialogRef<RetryLoadComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }
}
