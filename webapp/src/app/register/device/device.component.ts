import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import Log from "@dedis/cothority/log";

import { Router } from "@angular/router";
import { ByzCoinService } from "src/app/byz-coin.service";
import { showDialogOKC, showTransactions, TProgress } from "src/lib/Ui";

@Component({
    selector: "app-device",
    templateUrl: "./device.component.html",
})
export class DeviceComponent implements OnInit {
    text: string;

    constructor(
        private router: Router,
        private snack: MatSnackBar,
        private bcs: ByzCoinService,
        private dialog: MatDialog,
    ) {
        this.text = "Please wait";
    }

    async ngOnInit() {
        try {
            if (await this.bcs.hasUser()) {
                if (!(await showDialogOKC(this.dialog, "Overwrite user?", "There seems to" +
                    "be a user already defined on this browser. Do you want to overwrite it?",
                    {OKButton: "Overwrite", CancelButton: "Keep existing"}))) {
                    return this.router.navigate(["/"]);
                }
            }
            await showTransactions(this.dialog, "Attaching to existing user",
                async (progress: TProgress) => {
                    progress(50, "Attaching new device");
                    this.bcs.user = await this.bcs.retrieveUserByURL(window.location.href);
                });
            await this.router.navigate(["/"]);
        } catch (e) {
            Log.catch(e, "Couldn't register:");
            this.text = e.toString();
        }
    }
}
