import {Location} from "@angular/common";
import {Component, Inject, OnInit} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import Long from "long";
import {sprintf} from "sprintf-js";

import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import {IdentityDarc, IdentityWrapper, SignerEd25519} from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";

import {RenameComponent, ShowComponent} from "src/app/admin/devices/devices.component";
import {showDialogInfo, showTransactions, TProgress, UIViews} from "../../../lib/Ui";
import {ManageDarcComponent} from "../manage-darc";
import {ContactInfoComponent} from "./contact-info/contact-info.component";
import {
    ABActionsBS,
    ABContactsBS,
    ABGroupsBS,
    ActionBS, byzcoin,
    CredentialStructBS,
    KeyPair,
    User,
    UserSkeleton
} from "observable_dynacred";
import {UserService} from "src/app/user.service";
type DarcBS = byzcoin.DarcBS;

@Component({
    selector: "app-contacts",
    templateUrl: "./contacts.component.html",
})
export class ContactsComponent implements OnInit {
    contacts: ABContactsBS;
    actions: ABActionsBS;
    groups: ABGroupsBS;

    constructor(
        protected dialog: MatDialog,
        private snackBar: MatSnackBar,
        private location: Location,
        public user: UserService,
    ) {
        this.contacts = user.addressBook.contacts;
        this.actions = user.addressBook.actions;
        this.groups = user.addressBook.groups;
    }

    async ngOnInit() {
        Log.lvl3("init contacts");
    }

    /**
     * Pops up a dialog and asks for the alias and email of the new user to be created.
     * If any of the view or groups parameter is the non-default, it will not be asked
     * by the dialog.
     *
     * @param view - must be either undefined or one of Data.views
     * @param groups - must be either undefined or one of the user's available groups
     */
    async contactNew(view?: string, groups?: string[]) {
        const groupsInstAvail = await this.user.addressBook.groups.getValue();
        const groupsAvail = groupsInstAvail.map((g) => g.getValue().description.toString());
        const creds: IUserCred = {alias: "", email: "", view, groups, groupsAvail, recovery: undefined};
        // Search if the proposed groups are really available to the user
        if (groups && groups.find((group) => groupsAvail.find((g) => g === group) === undefined)) {
            return Promise.reject("unknown group");
        }
        const ac = this.dialog.open(UserCredComponent, {
            data: creds,
            width: "400px",
        });
        ac.afterClosed().subscribe(async (result: IUserCred) => {
            if (result && result.alias !== "") {
                const newUser = await showTransactions(this.dialog, "Creating new user " + result.alias,
                    async (progress: TProgress) => {
                        progress(30, "Creating User Instance");
                        const tempKey = KeyPair.rand();
                        const tx = this.user.startTransaction();
                        const newUser = new UserSkeleton(result.alias, this.user.spawnerInstanceBS.getValue().id,
                            tempKey.priv);

                        newUser.email = result.email;
                        if (result.view !== "") {
                            Log.lvl2("Setting default view of", result.view);
                            newUser.view = result.view;
                        }
                        newUser.addContact(this.user.credStructBS.id);

                        if (result.recovery && result.recovery !== UserCredComponent.noRecovery) {
                            progress(50, "Adding recovery");
                            const g = this.user.addressBook.groups.find(result.recovery);
                            if (g) {
                                const gIdentity = new IdentityDarc({id: g.getValue().getBaseID()});
                                newUser.addRecovery(gIdentity);
                            }
                        }

                        progress(70, "Updating groups");
                        // Update all chosen group-darcs to include the new user
                        result.groups.forEach(group => {
                            const g = this.user.addressBook.groups.find(group);
                            if (g) {
                                g.addSignEvolve(tx, newUser.darcSign.getBaseID(), undefined);
                                newUser.addGroup(g.getValue().getBaseID());
                            }
                        });

                        progress(80, "Adding User to Contacts");
                        this.user.addressBook.contacts.link(tx, newUser.credID);

                        progress(90, "sending to OmniLedger");
                        tx.createUser(newUser, Long.fromNumber(1e6));
                        await tx.sendCoins();
                        return newUser;
                    });
                const url = this.location.prepareExternalUrl("/register?ephemeral=" +
                    newUser.keyPair.priv.marshalBinary().toString("hex"));
                let host = window.location.host;

                // Easier manual UI testing: if the url is local[1-8], return an url with the next number.
                // This way you can have multiple users in multiple tabs on different hosts: local1, local2, ...
                if (host.match(/^local[1-8]?:4200$/)) {
                    let index = parseInt(host.slice(5, 6), 10);
                    if (!index) {
                        index = 0;
                    }
                    host = "local" + (index + 1) + ":4200";
                }
                this.dialog.open(SignupLinkComponent, {
                    data: `${window.location.protocol}//${host + url}`,
                    width: "400px",
                });
            }
        });
    }

    async contactLink() {
        const ac = this.dialog.open(AddContactComponent);
        ac.afterClosed().subscribe(async (result) => {
            if (result) {
                await showTransactions(this.dialog, "Linking contact", async (progress) => {
                    progress(50, "Updating contact list");
                    const userID = Buffer.from(result, "hex");
                    if (userID.length === 32) {
                        await this.user.executeTransactions(tx => this.contacts.link(tx, userID));
                    }
                })
            }
        });
    }

    async contactShow(contact: CredentialStructBS) {
        this.dialog.open(ContactInfoComponent, {data: {contact}});
    }

    async contactTransfer(c: CredentialStructBS) {
        const tc = this.dialog.open(TransferCoinComponent,
            {
                data: {alias: c.credPublic.alias.getValue()},
            });
        tc.afterClosed().subscribe(async (result) => {
            if (result) {
                Log.lvl1("Got coins:", result);
                const coins = Long.fromString(result);
                if (coins.greaterThan(0)) {
                    await showTransactions(this.dialog, "Transferring coins",
                        async (progress: TProgress) => {
                            progress(50, "Transferring Coins");
                            await this.user.executeTransactions(tx =>
                                this.user.coinBS.transferCoins(tx, c.credPublic.coinID.getValue(), coins));
                        });
                }
            }
        });
    }

    async contactRecover(c: CredentialStructBS) {
        const deviceStr: string =
            await showTransactions(this.dialog, "Adding new device", async (progress: TProgress) => {

                progress(30, "Checking if we have the right to recover " + c.credPublic.alias.getValue());
                const cSign = await this.user.retrieveCredentialSignerBS(c);
                if ((await this.user.bc.checkAuthorization(this.user.bc.genesisID, cSign.getValue().getBaseID(),
                    IdentityWrapper.fromIdentity(this.user.kiSigner))).length === 0) {
                    return showDialogInfo(this.dialog, "No recovery",
                        "Don't have the right to recover this user", "Understood");
                }

                progress(70, "Creating new device for recovery");
                const now = new Date();
                const name = sprintf("recovered by %s at %d/%02d/%02d %02d:%02d",
                    this.user.credStructBS.credPublic.alias.getValue(),
                    now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes());
                const ephemeralIdentity = SignerEd25519.random();
                await this.user.executeTransactions(tx => {
                    cSign.devices.create(tx, name, [ephemeralIdentity])
                });
                return sprintf("%s?credentialIID=%s&ephemeral=%s", User.urlNewDevice,
                    c.id.toString("hex"),
                    ephemeralIdentity.secret.marshalBinary().toString("hex"));
            });
        if (deviceStr) {
            const url = window.location.protocol + "//" + window.location.host +
                this.location.prepareExternalUrl(deviceStr);
            this.dialog.open(ShowComponent, {data: url});
        }
    }

    async contactUnlink(toDelete: CredentialStructBS) {
        await showTransactions(this.dialog, "Unlinking contact", async (progress) => {
            progress(50, "Updating contact list");
            await this.user.executeTransactions(tx => {
                this.user.addressBook.contacts.unlink(tx, toDelete.id);
            })
        })
    }

    async groupRename(g: DarcBS) {
        const ac = this.dialog.open(RenameComponent, {
            data: {
                name: g.getValue().description.toString(),
                typeStr: "group"
            }
        });
        ac.afterClosed().subscribe(async (result) => {
            if (result) {
                await showTransactions(this.dialog, "Renaming Group",
                    async (progress) => {
                        progress(50, "Updating description");
                        await this.user.executeTransactions(tx => {
                            g.evolveDarc(tx, {description: Buffer.from(result)})
                        })
                    })
            }
        })
    }

    async groupEdit(a: DarcBS, filter: string) {
        Log.lvl3("change groups");
        const tc = this.dialog.open(ManageDarcComponent,
            {
                data: {
                    darc: a.getValue(),
                    filter,
                    title: a.getValue().description.toString(),
                },
                height: "400px",
                width: "400px",
            });
        tc.afterClosed().subscribe(async (result) => {
            if (result) {
                await showTransactions(this.dialog, "Updating Darc",
                    async (progress: TProgress) => {
                        progress(50, "Storing new DARC");
                        await this.user.executeTransactions(tx => {
                            a.evolveDarc(tx, result);
                        });
                    });
            }
        });
    }

    async groupUnlink(g: DarcBS) {
        await showTransactions(this.dialog, "Unlink group", async (progress) => {
            progress(50, "Unlinking group");
            await this.user.executeTransactions(tx => {
                this.user.addressBook.groups.unlink(tx, g.getValue().getBaseID());
            })
        });
    }

    async groupCreate() {
        const name = await this.askNameOfNewDarcInstance("Group");
        if (name === undefined) {
            return;
        }

        await showTransactions(this.dialog, "Creating new Group", async (progress: TProgress) => {
            progress(50, "Creating new DARCs");
            await this.user.executeTransactions(tx =>
                this.groups.create(tx, name, [this.user.identityDarcSigner]), 1);
        });

    }

    async groupLink() {
        await this.getDarcInstance(this.groups, "Group");
    }

    async groupShow(inst: DarcBS) {
        this.dialog.open(DarcInstanceInfoComponent, {data: {inst}});
    }

    async actionCreate() {
        const name = await this.askNameOfNewDarcInstance("Action");
        if (name === undefined) {
            return;
        }

        await showTransactions(this.dialog, "Creating new Action", async (progress: TProgress) => {
            progress(50, "Creating new action");
            await this.user.executeTransactions(tx =>
                this.actions.create(tx, name, [this.user.identityDarcSigner]));
        });

    }

    async actionUnlink(a: ActionBS) {
        await showTransactions(this.dialog, "Unlink action", async (progress) => {
            progress(50, "Unlinking action");
            await this.user.executeTransactions(tx => {
                this.user.addressBook.actions.unlink(tx, a.darc.getValue().getBaseID());
            })
        });
    }

    async actionLink() {
        await this.getDarcInstance(this.actions, "Action");
    }

    async actionShow(inst: ActionBS) {
        this.dialog.open(DarcInstanceInfoComponent, {data: {inst}});
    }

    async actionRename(g: DarcBS) {
        const ac = this.dialog.open(RenameComponent, {
            data: {
                name: g.getValue().description.toString(),
                typeStr: "group"
            }
        });
        ac.afterClosed().subscribe(async (result) => {
            if (result) {
                await showTransactions(this.dialog, "Renaming Group",
                    async (progress) => {
                        progress(50, "Updating description");
                        await this.user.executeTransactions(tx => {
                            g.evolveDarc(tx, {description: Buffer.from(result)})
                        })
                    })
            }
        })
    }

    private async getDarcInstance(dbs: ABActionsBS | ABGroupsBS, type: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dialog.open(DarcInstanceAddComponent, {data: {type}})
                .afterClosed().subscribe(async (darcID: string | undefined) => {
                if (darcID === "" || darcID === undefined) {
                    return; // cancel yield empty string, escape yield undef
                }
                const id = Buffer.from(darcID, "hex");

                try {
                    const inst = await DarcInstance.fromByzcoin(this.user.bc, id);
                    if (dbs.getValue().some((a) => a.id.equals(id))) {
                        reject(`Given ${type} is already added under the name "${inst.darc.description}"`);
                    }
                    await this.user.executeTransactions(tx => dbs.link(tx, inst.id));
                } catch (e) {
                    if (e.message === `key not in proof: ${darcID}`) {
                        e = new Error(`Given ${type}'s ID was not found`);
                    }
                    reject(e);
                }
                resolve();
            });
        });
    }

    private async askNameOfNewDarcInstance(title: string): Promise<string | undefined> {
        return new Promise((resolve, _) =>
            this.dialog.open(CreateComponent, {data: title})
                .afterClosed().subscribe(resolve));
    }
}

export interface ITransferCoin {
    coins: string;
    alias: string;
}

@Component({
    selector: "app-transfer-coin",
    templateUrl: "transfer-coin.html",
})
export class TransferCoinComponent {

    constructor(
        public dialogRef: MatDialogRef<TransferCoinComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ITransferCoin) {
    }
}

export interface IUserCred {
    alias: string;
    email: string;
    view: string;
    groups: string[];
    groupsAvail: string[];
    recovery: string;
}

@Component({
    selector: "app-user-cred",
    templateUrl: "user-cred.html",
})
export class UserCredComponent {

    static noRecovery = "No recovery";
    views = UIViews;
    showGroups: boolean;
    showViews: boolean;
    recoveryGroups: string[];

    constructor(
        public dialogRef: MatDialogRef<TransferCoinComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IUserCred) {
        this.showGroups = data.groups === undefined;
        this.showViews = data.view === undefined;
        if (this.showViews) {
            data.view = UIViews[0];
        }
        data.groups = [];
        this.recoveryGroups = [UserCredComponent.noRecovery].concat(data.groupsAvail);
        data.recovery = this.recoveryGroups[0];
    }
}

@Component({
    selector: "app-signup-link",
    templateUrl: "signup-link.html",
})
export class SignupLinkComponent {

    constructor(
        public dialogRef: MatDialogRef<SignupLinkComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }

    dismiss(): void {
        this.dialogRef.close();
    }

}

@Component({
    selector: "app-add-contact",
    templateUrl: "add-contact.html",
})
export class AddContactComponent {

    userID: string;

    constructor(
        public dialogRef: MatDialogRef<AddContactComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }
}

@Component({
    selector: "app-create",
    templateUrl: "create.html",
})
export class CreateComponent {
    constructor(
        public dialogRef: MatDialogRef<CreateComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }
}

@Component({
    selector: "app-show-darcinstance",
    templateUrl: "show-darcinstance.html",
})
export class DarcInstanceInfoComponent {
    constructor(
        public dialogRef: MatDialogRef<DarcInstanceInfoComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { inst: DarcBS }) {
    }
}

@Component({
    selector: "app-add-darcinstance",
    templateUrl: "add-darcinstance.html",
})
export class DarcInstanceAddComponent implements OnInit {
    form: FormControl;

    constructor(
        public dialogRef: MatDialogRef<DarcInstanceAddComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { type: string }) {
    }

    async ngOnInit() {
        this.form = new FormControl(null, [
            Validators.required,
            Validators.pattern("[0-9a-f]{64}"),
        ]);
    }
}

export {
    ContactInfoComponent,
};
