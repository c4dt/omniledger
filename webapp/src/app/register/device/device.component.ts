import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import Log from "@dedis/cothority/log";

import { Data, StorageDB, TProgress } from "@c4dt/dynacred";

import { Router } from "@angular/router";
import { showDialogOKC, showTransactions } from "../../../lib/Ui";
import { UserData } from "../../user-data.service";

@Component({
    selector: "app-device",
    templateUrl: "./device.component.html",
})
export class DeviceComponent implements OnInit {
    text: string;

    constructor(
        private router: Router,
        private snack: MatSnackBar,
        private uData: UserData,
        private dialog: MatDialog,
    ) {
        this.text = "Please wait";
    }

    async ngOnInit() {
        try {
            const buf = await StorageDB.get(this.uData.dataFileName);
            if (buf !== undefined && buf.length > 0) {
                if (!(await showDialogOKC(this.dialog, "Overwrite user?", "There seems to" +
                    "be a user already defined on this browser. Do you want to overwrite it?",
                    {OKButton: "Overwrite", CancelButton: "Keep existing"}))) {
                    return this.router.navigate(["/"]);
                }
            }
            await showTransactions(this.dialog, "Attaching to existing user",
                async (progress: TProgress) => {
                    progress(50, "Attaching new device");
                    const newData = await Data.attachDevice(this.uData.bc, window.location.href);
                    newData.storage = StorageDB;
                    await newData.save();
                    progress(-75, "Storing Credential");
                    await this.uData.load();
                });
            await this.router.navigate(["/"]);
        } catch (e) {
            Log.catch("Couldn't register:", e);
            this.text = e.toString();
        }
    }
}
