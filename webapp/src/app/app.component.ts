import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";

import { IdentityWrapper } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";

import { showDialogOKC } from "src/lib/Ui";
import { BcviewerService } from "./bcviewer/bcviewer.component";
import { UserData } from "./user-data.service";

@Component({
    selector: "app-root",
    styleUrls: ["./app.component.css"],
    templateUrl: "./app.component.html",
})

export class AppComponent implements OnInit {
    loading = true;
    log: string = "";

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private bcs: BcviewerService,
        private uData: UserData,
    ) {
    }

    async ngOnInit() {
        await this.uData.loadConfig((msg: string) => {
            this.log += `\n${msg}`;
        });

        if (window.location.pathname.match(/\/register(\/device)?/)) {
            Log.lvl2("allowing registering with unknown Data");
            this.loading = false;
            return;
        }

        if (!(await this.uData.isAvailableInStorage())) {
            // No data saved - show how to get a new user
            this.loading = false;
            return this.newUser();
        } else {
            try {
                await this.uData.load();
                const signerDarc = await this.uData.contact.getDarcSignIdentity();
                const rules = await this.uData.bc.checkAuthorization(this.uData.bc.genesisID, signerDarc.id,
                    IdentityWrapper.fromIdentity(this.uData.keyIdentitySigner));
                if (rules.length === 0) {
                    this.uData.setValues({});
                    await this.uData.save();
                    await showDialogOKC(this.dialog, "Device revoked", "Sorry, but this device has been revoked." +
                    " If you want to use it again, you'll have to re-activate it.");
                    return this.newUser();
                }
                this.loading = false;
                this.bcs.updateBlocks();
            } catch (e) {
                // Data was here, but loading failed afterward - might be a network failure.
                const fileDialog = this.dialog.open(RetryLoadComponent, {
                    width: "300px",
                });
                fileDialog.afterClosed().subscribe(async (result: boolean) => {
                    if (result) {
                        window.location.reload();
                    } else {
                        this.loading = false;
                        return this.newUser();
                    }
                });
            }
        }
    }

    async newUser(): Promise<boolean> {
        const roster = this.uData.bc.getConfig().roster;
        if (roster && !roster.list[0].address.includes("localhost")) {
            return this.router.navigate(["/newuser"]);
        } else {
            return this.router.navigate(["/register"]);
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
