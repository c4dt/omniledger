import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import { Darc, IIdentity } from "@dedis/cothority/darc";
import Log from "../../../lib/cothority/log";
import { gData } from "../../../lib/Data";
import { Device } from "../../../lib/Device";
import { showDialogInfo, showSnack } from "../../../lib/ui/Ui";

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
    ) {
    }

    updateDevices() {
        const cred = gData.contact.credential.getCredential("1-devices");
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
        const signerDarc = await DarcInstance.fromByzcoin(gData.bc, device.darcID);
        if (await signerDarc.ruleMatch(Darc.ruleSign, [gData.keyIdentitySigner])) {
            return showDialogInfo(this.dialog, "No Suicide", "Cannot delete one's own device for security " +
                "reasons.", "Understood");
        }
        await showSnack(this.snack, "Deleting device " + device.name, async () => {
            await gData.deleteDevice(device.name);
            this.updateDevices();
        });
    }

    async add() {
        const ac = this.dialog.open(DeviceAddComponent);
        ac.afterClosed().subscribe(async (result) => {
            if (result) {
                // const result = "phone" + gData.contact.credential.getCredential("1-devices").attributes.length;
                let device: string;
                await showSnack(this.snack, "Adding new device", async () => {
                    device = await gData.createDevice(result);
                });
                this.updateDevices();
                if (device) {
                    this.dialog.open(DeviceShowComponent,
                        {data: device});
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
