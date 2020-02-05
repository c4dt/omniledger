import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";

import { IdentityWrapper } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";

import { showDialogOKC } from "src/lib/Ui";
import { version } from "../../package.json";
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
    text: string;
    percentage: number;
    bcviewer = false;
    version = version;

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private bcs: BcviewerService,
        private uData: UserData,
    ) {
    }

    logAppend(msg: string, perc: number) {
        this.log += `${msg}\n`;
        this.text = msg;
        this.percentage = perc;
    }

    async ngOnInit() {
        await this.uData.loadConfig((msg: string, perc: number) => {
            this.logAppend(msg, perc * 0.8);
        });

        if (window.location.pathname.match(/\/explorer\//)) {
            Log.lvl2("using explorer - don't load user");
            this.loading = false;
            return;
        }

        Log.lvl2("Starting to update blocks for viewer");
        this.bcs.updateBlocks();
        this.bcviewer = true;

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
                this.logAppend("Loading data", 90);
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
                this.logAppend("Done", 100);
                this.loading = false;
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
