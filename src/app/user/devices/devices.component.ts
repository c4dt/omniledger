import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material";
import { gData } from "../../../lib/Data";
import { Device } from "../../../lib/Device";

@Component({
    selector: "app-devices",
    styleUrls: ["./devices.component.css"],
    templateUrl: "./devices.component.html",
})
export class DevicesComponent implements OnInit {
    devices: Device[] = [];

    constructor(
        private dialog: MatDialog,
    ) {
        const cred = gData.contact.credential.getCredential("1-devices");
        if (cred) {
            this.devices = cred.attributes.map((a) => new Device(a.name, a.value));
        }
    }

    ngOnInit() {
    }

    delete(device: Device) {
    }

    async add() {
        // const ac = this.dialog.open(DeviceAddComponent);
        // ac.afterClosed().subscribe(async (result) => {
        //     if (result) {
        const result = "phone" + gData.contact.credential.getCredential("1-devices").attributes.length;
        const device = await gData.createDevice(result);
        this.dialog.open(DeviceShowComponent,
            {data: device});
    }

    // });
    // }
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
