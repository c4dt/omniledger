import {Location} from "@angular/common";
import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";

import {InstanceID} from "@dedis/cothority/byzcoin";
import {Darc, IdentityEd25519} from "@dedis/cothority/darc";

import {TProgress} from "@c4dt/dynacred";

import {Attribute, Credential} from "@dedis/cothority/personhood/credentials-instance";
import {showDialogInfo, showDialogOKC, showSnack, showTransactions} from "src/lib/Ui";
import {UserData} from "../../user-data.service";
import {CSTypesBS, DarcBS, KeyPair, User} from "observable_dynacred";
import {Log} from "@dedis/cothority";

type RenameType = "devices" | "recovery";

class Signer {
    descr: string;
    name: string;
    darcID: InstanceID;

    constructor(attr: Attribute) {
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
    devices: CSTypesBS;
    recovery: CSTypesBS;

    constructor(
        private dialog: MatDialog,
        private snack: MatSnackBar,
        private location: Location,
        private uData: UserData,
    ) {
        this.devices = uData.user.credSignerBS.devices;
        this.recovery = uData.user.credSignerBS.recoveries;
    }

    async deleteDevice(device: DarcBS) {
        if (this.devices.getValue().length <= 1) {
            return showDialogInfo(this.dialog, "Too few devices", "There must be at least one device available, so " +
                "it's not possible to remove the only device you have.", "Understood");
        }
        try {
            const deviceID = IdentityEd25519.fromPoint(this.uData.user.kpp.pub);
            if (device.getValue().rules.getRule(Darc.ruleSign).getIdentities().find(ident => ident === deviceID.toString())) {
                return showDialogInfo(this.dialog, "No Suicide", "Cannot delete one's own device for security " +
                    "reasons.", "Understood");
            }
            const name = device.getValue().description.toString().replace(/^device:/, '');
            const confirm = await showDialogOKC(this.dialog, `Unlinking device`,
                `Do you really want to remove the device ${name} from your keyring??`,
                {OKButton: `Delete`, CancelButton: `Keep`});
            if (confirm) {
                await showTransactions(this.dialog, "Deleting device " + name,
                    async (progress: TProgress) => {
                        progress(30, "Deleting Device");
                        await this.uData.user.executeTransactions(tx =>
                            this.uData.user.credSignerBS.devices.unlink(tx, name));
                    });
            }
        } catch (e) {
            await showDialogInfo(this.dialog, "Error while unlinking", e, "Too Bad");
        }
    }

    async addDevice() {
        const ac = this.dialog.open(DeviceAddComponent);
        ac.afterClosed().subscribe(async (result) => {
            if (result !== undefined && result !== "") {
                const device: string =
                    await showTransactions(this.dialog, "Adding new device",
                        async (progress: TProgress) => {
                            progress(50, "Creating new device darc");
                            const ephemeralIdentity = KeyPair.rand().signer();
                            Log.print("result is:", result);
                            await this.uData.user.executeTransactions(tx => {
                                this.uData.user.credSignerBS.devices.create(tx, result, [ephemeralIdentity]);
                            });
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

    async rename(type: CSTypesBS, name: string) {
        const oldName = name.replace(`/^${type.prefix}:/`, '');
        const ac = this.dialog.open(RenameComponent, {
            data: {
                name: oldName,
                typeStr: type.prefix
            }
        });
        ac.afterClosed().subscribe(async (newName) => {
            if (newName === undefined || newName === "") {
                return;
            }
            await showTransactions(this.dialog, `Renaming ${type.prefix}:${oldName}`,
                async (progress: TProgress) => {
                    progress(50, "Renaming and updating credential");
                    await this.uData.user.executeTransactions(tx => type.rename(tx, oldName, newName));
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
            if (this.recovery.getValue().find((r) => r.getValue().description.toString() === result)) {
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
                    this.recovery.getValue().splice(this.recovery.getValue().findIndex((dev) =>
                        dev.getValue().getBaseID().equals(d.darcID)), 1);
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
