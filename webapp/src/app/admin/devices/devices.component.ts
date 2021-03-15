import { Location } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import { InstanceID } from "@dedis/cothority/byzcoin";
import { Darc, IdentityEd25519 } from "@dedis/cothority/darc";
import { Attribute } from "@dedis/cothority/personhood/credentials-instance";
import { byzcoin, CSTypesBS, KeyPair, Migrate } from "dynacred";
import { ByzCoinService } from "src/app/byz-coin.service";
import { UserService } from "src/app/user.service";
import { DarcInstanceInfoComponent, RenameComponent, ShowComponent } from "src/lib/show/show.component";
import { showDialogInfo, showDialogOKC, showSnack, showTransactions, TProgress } from "src/lib/Ui";

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
    recoveries: CSTypesBS;

    constructor(
        private dialog: MatDialog,
        private snack: MatSnackBar,
        private location: Location,
        private user: UserService,
        private builder: ByzCoinService,
    ) {
        this.devices = user.credSignerBS.devices;
        this.recoveries = user.credSignerBS.recoveries;
    }

    async deviceRevoke(device: byzcoin.DarcBS) {
        if (this.devices.getValue().length <= 1) {
            return showDialogInfo(this.dialog, "Too few devices", "There must be at least one device available, so " +
                "it's not possible to remove the only device you have.", "Understood");
        }
        try {
            const deviceID = IdentityEd25519.fromPoint(this.user.kpp.pub);
            if (device.getValue().rules.getRule(Darc.ruleSign).getIdentities()
                .find((ident) => ident === deviceID.toString())) {
                return showDialogInfo(this.dialog, "No Suicide", "Cannot revoke one's own device for security " +
                    "reasons.", "Understood");
            }
            const name = device.getValue().description.toString().replace(/^device:/, "");
            const confirm = await showDialogOKC(this.dialog, `Revoke device`,
                `Do you really want to revoke the device ${name} from your keyring??`,
                {OKButton: `Revoke`, CancelButton: `Keep`});
            if (confirm) {
                await showTransactions(this.dialog, "Revoking device " + name,
                    async (progress: TProgress) => {
                        progress(30, "Revoking Device");
                        await this.user.executeTransactions((tx) =>
                            this.user.credSignerBS.devices.unlink(tx, device.getValue().getBaseID()), 10);
                    });
            }
        } catch (e) {
            await showDialogInfo(this.dialog, "Error while revoking", e, "Too Bad");
        }
    }

    async deviceCreate() {
        const ac = this.dialog.open(DeviceAddComponent);
        ac.afterClosed().subscribe(async (result) => {
            if (result !== undefined && result !== "") {
                const device: string =
                    await showTransactions(this.dialog, "Adding new device",
                        async (progress: TProgress) => {
                            progress(50, "Creating new device darc");
                            const ephemeralIdentity = KeyPair.rand().signer();
                            await this.user.executeTransactions((tx) => {
                                this.user.credSignerBS.devices.create(tx, result, [ephemeralIdentity]);
                            }, 10);
                            return this.user.getUrlForDevice(ephemeralIdentity.secret);
                        });
                const url = this.builder.config.baseURL + device;
                this.dialog.open(ShowComponent, {data: url});
            }
        });
    }

    async rename(type: CSTypesBS, dev: byzcoin.DarcBS) {
        const name = this.getName(type, dev);
        const oldName = name.replace(`/^${type.prefix}:/`, "");
        const ac = this.dialog.open(RenameComponent, {
            data: {
                name: oldName,
                typeStr: type.prefix,
            },
        });
        ac.afterClosed().subscribe(async (newName) => {
            if (newName === undefined || newName === "") {
                return;
            }
            await showTransactions(this.dialog, `Renaming ${type.prefix}:${oldName}`,
                async (progress: TProgress) => {
                    progress(50, "Renaming and updating credential");
                    await this.user.executeTransactions((tx) =>
                        type.rename(tx, dev.getValue().getBaseID(), newName), 10);
                });
        });
    }

    async recoveryCreate(noSign = true) {
        const accounts: IAccount[] = [];
        await showSnack(this.snack, "Searching actions and groups", async () => {
            for (const c of this.user.addressBook.contacts.getValue()) {
                accounts.push({
                    id: (await this.builder.retrieveSignerIdentityDarc(c.darcID)).id,
                    name: c.credPublic.alias.getValue(),
                });
            }
            const darcs = this.user.addressBook.groups.getValue()
                .concat(this.user.addressBook.actions.getValue().map((a) => a.darc));
            for (const g of darcs) {
                accounts.push({
                    id: g.getValue().getBaseID(),
                    name: g.getValue().description.toString(),
                });
            }
        });
        if (accounts.length === 0) {
            return showDialogInfo(this.dialog, "No accounts found",
                "Sorry, there are no accounts linked to this user.", "OK");
        }
        const ac = this.dialog.open(DeviceRecoveryComponent, {data: accounts});
        ac.afterClosed().subscribe(async (result) => {
            if (result === undefined || result === "") {
                return;
            }

            const d = accounts.find((acc) => acc.id.equals(result));
            if (d === undefined) {
                return showDialogInfo(this.dialog, "No such account",
                    "Didn't find the chosen account.", "Go on");
            }
            if (this.recoveries.getValue().find((r) => r.getValue().description.toString() === result)) {
                await showDialogInfo(this.dialog, "Duplicate name", `The recovery-name ${result} already exists`,
                    "Change");
                return this.recoveryCreate();
            }
            // this.recovery.push(new Signer(d));
            await showTransactions(this.dialog, "Adding recovery account",
                async (progress: TProgress) => {
                    progress(50, "Adding new recovery account");
                    await this.user.executeTransactions((tx) => {
                        this.user.credSignerBS.recoveries.link(tx, d.name, result, noSign);
                    }, 10);
                });
        });
    }

    async recoveryDelete(dev: byzcoin.DarcBS) {
        if (await showDialogOKC(this.dialog, "Remove Recovery",
            "Are you sure to remove this device from the option of recovery?",
            {OKButton: "Remove", CancelButton: "Keep it"})) {
            await showTransactions(this.dialog, "Removing recovery account",
                async (progress: TProgress) => {
                    progress(50, "Removing recovery account");
                    await this.user.executeTransactions((tx) => {
                        this.user.credSignerBS.recoveries.unlink(tx, dev.getValue().getBaseID());
                    }, 10);
                });
        }
    }

    async recoveryUpdate(dev: byzcoin.DarcBS) {
        await showTransactions(this.dialog, "Updating recovery account",
            async (progress: TProgress) => {
                progress(50, "Removing signing rule");
                await this.user.executeTransactions((tx) =>
                    Migrate.updateRecovery(tx, this.user.credSignerBS, dev), 10);
            });
    }

    recoveryVersion0(dev: byzcoin.DarcBS): boolean {
        return Migrate.versionRecovery(this.user.credSignerBS.getValue(), dev) === 0;
    }

    getName(cst: CSTypesBS, dev: byzcoin.DarcBS): string {
        return cst.cim.getEntry(dev.getValue().getBaseID());
    }

    isActiveDevice(cst: CSTypesBS, dev: byzcoin.DarcBS): boolean {
        return cst !== undefined && this.getName(cst, dev) !== undefined;
    }

    async darcShow(inst: byzcoin.DarcBS) {
        this.dialog.open(DarcInstanceInfoComponent, {data: {inst}});
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
