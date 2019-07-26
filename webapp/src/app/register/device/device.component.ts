import { Component, OnInit } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";

import Log from "@dedis/cothority/log";

import { Data } from "@c4dt/dynacred";

import { showSnack } from "../../../lib/Ui";
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
    ) {
        this.text = "Please wait";
    }

    async ngOnInit() {
        try {
            return showSnack(this.snack, "Attaching to existing user", async () => {
                const newData = await Data.attachDevice(this.uData.bc, window.location.href);
                await newData.save();
                await this.router.navigate([]);
            });
        } catch (e) {
            Log.catch("Couldn't register:", e);
            this.text = e.toString();
        }
    }
}
