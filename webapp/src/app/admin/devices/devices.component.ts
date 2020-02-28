import {Location} from "@angular/common";
import {Component, Inject} from "@angular/core";
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef
} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";

import {InstanceID} from "@dedis/cothority/byzcoin";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import {Darc} from "@dedis/cothority/darc";

import {Data, Device, TProgress} from "@c4dt/dynacred";

import {
    Attribute,
    Credential
} from "@dedis/cothority/personhood/credentials-instance";
import {
    showDialogInfo,
    showDialogOKC,
    showSnack,
    showTransactions
} from "src/lib/Ui";
import {UserData} from "../../user-data.service";
import {KeyPair, User} from "observable_dynacred";
import {Log} from "@dedis/cothority";

type RenameType = "devices" | "recovery";

class Signer{
    descr: string;
    name: string;
    darcID: InstanceID;

    constructor(attr: Attribute){
        this.descr = attr.name;
        this.name = attr.name.replace(/^(device|recovery):/, "");
        this.darcID = attr.value;
    }
}

@Component({
    selector: "app-devices",
    templateUrl: "./devices.component.html",
})
export class DevicesComponent {
    devices: Signer[] = [];
    recovery: Signer[] = [];

    constructor(
        private dialog: MatDialog,
        private snack: MatSnackBar,
        private location: Location,
        private uData: UserData,
    ) {
        uData.user.credStructBS.credDevices
            .subscribe((devices) => {
                    Log.print("Devices are:", devices);
                    this.devices = devices.attributes.map((a) => new Signer(a));
                }
            );
        uData.user.credStructBS.credRecoveries
            .subscribe((recoveries) => {
                    this.recovery = recoveries.attributes.map((a) => new Signer(a));
                }
            );
    }

    async deleteDevice(device: Signer) {
        if (this.devices.length <= 1) {
            return showDialogInfo(this.dialog, "Too few devices", "There must be at least one device available, so " +
                "it's not possible to remove the only device you have.", "Understood");
        }
        try {
            const signerDarc = await DarcInstance.fromByzcoin(this.uData.bc, device.darcID);
            if (await signerDarc.ruleMatch(Darc.ruleSign, [this.uData.user.dt.kiSigner])) {
                return showDialogInfo(this.dialog, "No Suicide", "Cannot delete one's own device for security " +
                    "reasons.", "Understood");
            }
            const confirm = await showDialogOKC(this.dialog, `Deleting device`,
                `Do you really want to delete the device ${device.name}?`,
                {OKButton: `Delete`, CancelButton: `Keep`});
            if (confirm) {
                await showTransactions(this.dialog, "Deleting device " + device.name,
                    async (progress: TProgress) => {
                        progress(30, "Deleting Device");
                        await this.uData.user.credSignerBS.rmDevice(device.name);
                    });
            }
        } catch(e){
            await this.uData.user.credSignerBS.rmDevice(device.name);
        }
    }

    async addDevice() {
        const ac = this.dialog.open(DeviceAddComponent);
        ac.afterClosed().subscribe(async (result) => {
            if (result !== undefined && result !== "") {
                if (this.devices.find((d) => d.name === `device:${result}`)) {
                    await showDialogInfo(this.dialog, "Duplicate name", `The device-name ${result} already exists`,
                        "Change");
                    return this.addDevice();
                }
                const device: string =
                    await showTransactions(this.dialog, "Adding new device",
                        async (progress: TProgress) => {
                            progress(50, "Creating new device darc");
                            const ephemeralIdentity = KeyPair.rand().signer();
                            Log.print("result is:", result);
                            await this.uData.user.credSignerBS.addDevice(result, ephemeralIdentity);
                            return `${User.urlNewDevice}?` +
                                `credentialIID=${this.uData.user.credStructBS.id.toString("hex")}` +
                                `&ephemeral=${ephemeralIdentity.secret.marshalBinary().toString("hex")}`;
                        });
                const url = window.location.protocol + "//" + window.location.host +
                    this.location.prepareExternalUrl(device);
                this.dialog.open(ShowComponent, {data: url});
            }
        });
    }

    async rename(dev: Signer, typeStr: RenameType) {
        const ac = this.dialog.open(RenameComponent, {
            data: {
                name: dev.name,
                typeStr
            }
        });
        ac.afterClosed().subscribe(async (result) => {
            if (result === undefined || result === "") {
                return;
            }
            if (this.devices.concat(this.recovery).find((d) => d.name === result)) {
                await showDialogInfo(this.dialog, "Duplicate name", `The ${typeStr}-name ${result} already exists`,
                    "Change");
                return this.rename(dev, typeStr);
            }

            dev.name = result;
            await showTransactions(this.dialog, `Renaming ${typeStr}`,
                async (progress: TProgress) => {
                    const name = typeStr === "devices" ? "1-devices" : "1-recovery";
                    const atts = typeStr === "devices" ? this.devices : this.recovery;
                    this.uData.contact.credential.setCredential(name,
                        new Credential({
                            attributes: atts.map((d) => new Attribute({
                                name: d.name,
                                value: d.darcID
                            })),
                            name,
                        }));
                    this.uData.contact.incVersion();
                    progress(50, "Updating credential");
                    await this.uData.save();
                });
        });
    }

    async addRecovery() {
        const accounts: IAccount[] = [];
        await this.uData.contact.updateOrConnect(this.uData.bc, true);
        await showSnack(this.snack, "Searching actions and groups", async () => {
            for (const c of this.uData.contacts) {
                accounts.push({
                    id: (await c.getDarcSignIdentity()).id,
                    name: c.alias,
                });
            }
            const darcs = (await this.uData.contact.getGroups())
                .concat(await this.uData.contact.getActions());
            for (const g of darcs) {
                accounts.push({
                    id: g.darc.getBaseID(),
                    name: g.darc.description.toString(),
                });
            }
        });
        if (accounts.length === 0) {
            return showDialogInfo(this.dialog, "No accounts found",
                "Sorry, there are no accounts linked to this user.", "OK");
        }
        const ac = this.dialog.open(DeviceRecoveryComponent, {data: accounts});
        ac.afterClosed().subscribe(async (result) => {
            if (result === undefined) {
                return;
            }

            const d = accounts.find((acc) => acc.id.equals(result));
            if (d === undefined) {
                return showDialogInfo(this.dialog, "No such account",
                    "Didn't find the chosen account.", "Go on");
            }
            if (this.recovery.find((r) => r.name === result)) {
                await showDialogInfo(this.dialog, "Duplicate name", `The recovery-name ${result} already exists`,
                    "Change");
                return this.addRecovery();
            }
            // this.recovery.push(new Signer(d));
            await showTransactions(this.dialog, "Adding recovery account",
                async (progress: TProgress) => {
                    progress(33, "Adding new recovery account");
                    await this.uData.contact.addSigner("1-recovery", d.name, result);
                    progress(66, "Updating account");
                    await this.uData.contact.sendUpdate();
                });
        });
    }

    async deleteRecovery(d: Signer) {
        if (await showDialogOKC(this.dialog, "Remove Recovery",
            "Are you sure to remove this device from the option of recovery?",
            {OKButton: "Remove", CancelButton: "Keep it"})) {
            await showTransactions(this.dialog, "Removing recovery account",
                async (progress: TProgress) => {
                    this.recovery.splice(this.recovery.findIndex((dev) => dev.darcID.equals(d.darcID)), 1);
                    progress(33, "Removing recovery account");
                    await this.uData.contact.rmSigner("1-recovery", d.darcID);
                    progress(66, "Updating account");
                    await this.uData.contact.sendUpdate();
                });
        }
    }
}

@Component({
    selector: "device-add",
    templateUrl: "device-add.html",
})
export class DeviceAddComponent {
    typeStr: string;

    constructor(
        public dialogRef: MatDialogRef<DeviceAddComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }
}

@Component({
    selector: "show",
    templateUrl: "show.html",
})
export class ShowComponent {
    constructor(
        public dialogRef: MatDialogRef<ShowComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }
}

interface IDeviceType {
    typeStr: string;
    name: string;
}

@Component({
    selector: "rename",
    templateUrl: "rename.html",
})
export class RenameComponent {
    origName: string;

    constructor(
        public dialogRef: MatDialogRef<RenameComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IDeviceType) {
        this.origName = data.name;
    }
}

interface IAccount {
    id: InstanceID;
    name: string;
}

@Component({
    selector: "device-recovery",
    templateUrl: "device-recovery.html",
})
export class DeviceRecoveryComponent {
    selected: InstanceID;

    constructor(
        public dialogRef: MatDialogRef<ShowComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IAccount[]) {
        this.selected = data[0].id;
    }
}
