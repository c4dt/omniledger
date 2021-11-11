import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";

import { IdentityWrapper } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";

import { ByzCoinService, DBError } from "src/app/byz-coin.service";
import { showDialogInfo, showDialogOKC } from "src/lib/Ui";
import { version } from "../../package.json";
import { DBErrorDialog } from "./db-error-dialog/db-error-dialog.component";

@Component({
    selector: "app-root",
    styleUrls: ["./app.component.scss"],
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
        private bcs: ByzCoinService,
    ) {
        Log.lvl = 2;
    }

    logAppend(msg: string, perc: number) {
        this.log += `${msg}\n`;
        this.text = msg;
        this.percentage = perc;
        Log.lvl2("UI-log:", perc, msg);
    }

    async ngOnInit() {
        try {
            await this.bcs.loadConfig((msg: string, perc: number) => {
                this.logAppend(msg, perc * 0.8);
            });
        } catch (e) {
            if (e instanceof DBError) {
                await DBErrorDialog.open(this.dialog, e);
            } else {
                await showDialogInfo(this.dialog, "Error",
                    `Something went wrong while loading the config: ${e.toString()}`, "Cancel");
            }
            this.loading = false;
            return this.newUser();
        }

        if (window.location.pathname.match(/\/explorer\//)) {
            Log.lvl2("using explorer - don't load user");
            this.loading = false;
            return;
        }

        Log.lvl2("Starting to update blocks for viewer");
        this.bcviewer = true;

        if (window.location.pathname.match(/\/register(\/device)?/)) {
            Log.lvl2("allowing registering with unknown Data");
            this.loading = false;
            return;
        }

        this.logAppend("Checking if user exists", 20);
        if (!(await this.bcs.hasUser())) {
            this.logAppend("Checking if we can migrate", 30);
            try {
                await this.bcs.migrate();
            } catch (e) {
                // No data saved - show how to get a new user
                Log.catch(e, "couldn't migrate data");
                this.loading = false;
                return this.newUser();
            }
            this.logAppend("Migration successful, reloading", 100);
            setTimeout(() => this.ngOnInit(), 1000);
        } else {
            try {
                this.logAppend("Loading data", 80);
                await this.bcs.loadUser();
                const signerDarc = await this.bcs.user.identityDarcSigner;
                const rules = await this.bcs.bc.checkAuthorization(this.bcs.bc.genesisID, signerDarc.id,
                    IdentityWrapper.fromIdentity(this.bcs.user.kiSigner));
                if (rules.length === 0) {
                    await this.bcs.user.clearDB();
                    await showDialogOKC(this.dialog, "Device revoked", "Sorry, but this device has been revoked." +
                        " If you want to use it again, you'll have to re-activate it.");
                    return this.newUser();
                }
                this.logAppend("Done", 100);
                this.loading = false;
            } catch (e) {
                Log.catch(e, "failed loading user");
                // Data was here, but loading failed afterward - might be a network failure.
                const fileDialog = this.dialog.open(RetryLoadComponent, {
                    width: "300px",
                });
                fileDialog.afterClosed().subscribe(async (result: boolean) => {
                    if (result) {
                        window.location.reload();
                    } else {
                        return this.newUser();
                    }
                });
            }
        }
    }

    async newUser(): Promise<boolean> {
        this.loading = false;
        const roster = this.bcs.bc.getConfig().roster;
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
