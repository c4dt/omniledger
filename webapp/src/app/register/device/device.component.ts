import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import Log from "src/lib/cothority/log";

import { Data } from "src/lib/dynacred";

import { Router } from "@angular/router";
import ByzCoinRPC from "src/lib/cothority/byzcoin/byzcoin-rpc";
import { showTransactions, TProgress } from "../../../lib/Ui";
import { UserData } from "../../user-data.service";

@Component({
    selector: "app-device",
    styleUrls: ["./device.component.css"],
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
            await showTransactions(this.dialog, "Attaching to existing user",
                async (progress: TProgress) => {
                    progress(50, "Attaching new device");
                    const newData = await Data.attachDevice(this.uData.bc, window.location.href);
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
