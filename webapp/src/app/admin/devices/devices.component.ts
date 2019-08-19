import { Location } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import { Darc } from "@dedis/cothority/darc";

import { Device } from "@c4dt/dynacred";

import { showDialogInfo, showTransactions, TProgress } from "../../../lib/Ui";
import { UserData } from "../../user-data.service";

@Component({
    selector: "app-devices",
    styleUrls: ["./devices.component.css"],
    templateUrl: "./devices.component.html",
})
export class DevicesComponent implements OnInit {
    devices: Device[] = [];

    constructor(
        private dialog: MatDialog,
        private snack: MatSnackBar,
        private location: Location,
        private uData: UserData,
    ) {
    }

    updateDevices() {
        const cred = this.uData.contact.credential.getCredential("1-devices");
        if (cred) {
            this.devices = cred.attributes.map((a) => new Device(a.name, a.value));
        }
    }

    ngOnInit() {
        this.updateDevices();
    }

    async delete(device: Device) {
        if (this.devices.length <= 1) {
            return showDialogInfo(this.dialog, "Too few devices", "There must be at least one device available, so " +
                "it's not possible to remove the only device you have.", "Understood");
        }
        const signerDarc = await DarcInstance.fromByzcoin(this.uData.bc, device.darcID);
        if (await signerDarc.ruleMatch(Darc.ruleSign, [this.uData.keyIdentitySigner])) {
            return showDialogInfo(this.dialog, "No Suicide", "Cannot delete one's own device for security " +
                "reasons.", "Understood");
        }
        await showTransactions(this.dialog, "Deleting device " + device.name,
            async (progress: TProgress) => {
                progress(30, "Deleting Device");
                await this.uData.deleteDevice(device.name);
                progress(-60, "Fetching all devices");
                this.updateDevices();
            });
    }

    async add() {
        const ac = this.dialog.open(DeviceAddComponent);
        ac.afterClosed().subscribe(async (result) => {
            if (result) {
                // const result = "phone" + this.uData.contact.credential.getCredential("1-devices").attributes.length;
                let device: string;
                await showTransactions(this.dialog, "Adding new device",
                    async (progress: TProgress) => {
                        progress(50, "Creating Device");
                        device = await this.uData.createDevice(result);
                    });
                this.updateDevices();
                if (device) {
                    const url = window.location.protocol + "//" + window.location.host +
                        this.location.prepareExternalUrl(device);
                    this.dialog.open(DeviceShowComponent, {data: url});
                }
            }
        });
    }
}

@Component({
    selector: "device-add",
    templateUrl: "device-add.html",
})
export class DeviceAddComponent {
    constructor(
        public dialogRef: MatDialogRef<DeviceAddComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }

    cancel(): void {
        this.dialogRef.close();
    }
}

@Component({
    selector: "device-show",
    templateUrl: "device-show.html",
})
export class DeviceShowComponent {
    constructor(
        public dialogRef: MatDialogRef<DeviceShowComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }

    cancel(): void {
        this.dialogRef.close();
    }
}
