import {Location} from "@angular/common";
import {Component, Inject, OnInit} from "@angular/core";
import {FormControl, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";

import Long from "long";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import {IdentityDarc, Rule} from "@dedis/cothority/darc";
import Darc from "@dedis/cothority/darc/darc";
import Log from "@dedis/cothority/log";

import {Contact, Data, FileBlob, TProgress} from "@c4dt/dynacred";

import {showTransactions, storeCredential} from "../../../lib/Ui";
import {UserData} from "../../user-data.service";
import {ManageDarcComponent} from "../manage-darc";

import {ContactInfoComponent} from "./contact-info/contact-info.component";
import {
    ABActionsBS,
    ABContactsBS,
    ABGroupsBS,
    CredentialStructBS,
    DarcBS,
    EAttributesConfig,
    EAttributesPublic,
    ECredentials,
    KeyPair,
    UserFactory
} from "observable_dynacred";
import {RenameComponent} from "src/app/admin/devices/devices.component";

@Component({
    selector: "app-contacts",
    templateUrl: "./contacts.component.html",
})
export class ContactsComponent implements OnInit {
    calypsoOurKeys: string[];
    calypsoOtherKeys: Map<Contact, FileBlob[]>;
    contacts: ABContactsBS;
    actions: ABActionsBS;
    groups: ABGroupsBS;

    constructor(
        protected dialog: MatDialog,
        private snackBar: MatSnackBar,
        private location: Location,
        public uData: UserData,
    ) {
        this.calypsoOtherKeys = new Map();
        this.contacts = uData.user.addressBook.contacts;
        this.actions = uData.user.addressBook.actions;
        this.groups = uData.user.addressBook.groups;
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
        const groupsInstAvail = await this.uData.contact.getGroups();
        const groupsAvail = groupsInstAvail.map((g) => g.darc.description.toString());
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
                        const tx = this.uData.user.startTransaction();
                        const newUser = new UserFactory(result.alias, this.uData.user.spawnerInstanceBS.getValue().id, tempKey.priv);

                        newUser.cred.setAttribute(ECredentials.pub, EAttributesPublic.email, result.email);
                        if (result.view !== "") {
                            Log.lvl2("Setting default view of", result.view);
                            newUser.cred.setAttribute(ECredentials.config, EAttributesConfig.view, result.view);
                        }
                        newUser.cred.setAttribute(ECredentials.pub, EAttributesPublic.contacts, this.uData.user.credStructBS.id);

                        // Concatenate multiple instructions into one clientTransaction, so that
                        // the update is faster, as there won't be a wait for all transactions to
                        // go in.

                        if (result.recovery && result.recovery !== UserCredComponent.noRecovery) {
                            progress(50, "Adding recovery");
                            const g = this.uData.user.addressBook.groups.find(result.recovery);
                            if (g) {
                                const gIdentity = new IdentityDarc({id: g.getValue().getBaseID()}).toString();
                                newUser.darcSign.rules.getRule(Darc.ruleSign).append(gIdentity, Rule.OR);
                                newUser.darcSign.rules.getRule(DarcInstance.ruleEvolve).append(gIdentity, Rule.OR);
                            }
                        }

                        progress(70, "Updating groups");
                        // Update all chosen group-darcs to include the new user
                        const newGroups: string[] = [];
                        result.groups.forEach(group => {
                            const g = this.uData.user.addressBook.groups.find(group);
                            if (g) {
                                g.addSignEvolve(tx, newUser.darcSign.getBaseID(), undefined);
                                newGroups.push(g.getValue().getBaseID().toString("hex"));
                            }
                        });
                        // Update the new user
                        newUser.cred.setAttribute(ECredentials.pub, EAttributesPublic.groups,
                            Buffer.from(newGroups.join(), "hex"));

                        progress(80, "Adding User to Contacts");
                        this.uData.user.addressBook.contacts.link(tx, newUser.credID);

                        progress(90, "sending to OmniLedger");
                        tx.createUser(newUser, Long.fromNumber(1e6));
                        await tx.send();
                        return newUser;
                    });
                const url = this.location.prepareExternalUrl("/register?ephemeral=" +
                    newUser.keyPair.priv.marshalBinary().toString("hex"));
                let host = window.location.host;
                if (host.match(/^local[1-9]?:4200$/)) {
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
                Log.lvl1("Got new contact:", result);
                const userID = Buffer.from(result, "hex");
                if (userID.length === 32) {
                    await this.uData.user.executeTransactions(tx => this.contacts.link(tx, userID));
                }
            }
        });
    }

    async contactShow(contact: CredentialStructBS) {
        this.dialog.open(ContactInfoComponent, {data: {contact}});
    }

    async transferCoin(c: CredentialStructBS) {
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
                            await this.uData.user.executeTransactions(tx =>
                                this.uData.user.coinBS.transferCoins(tx, c.credPublic.coinID.getValue(), coins));
                        });
                }
            }
        });
    }

    async contactRecover(c: CredentialStructBS) {
        // const cid = await c.getDarcSignIdentity();
        // if ((await this.uData.bc.checkAuthorization(this.uData.bc.genesisID, cid.id,
        //     IdentityWrapper.fromIdentity(this.uData.keyIdentitySigner))).length === 0) {
        //     return showDialogInfo(this.dialog, "No recovery",
        //         "Don't have the right to recover this user", "Understood");
        // }
        // const signers = [this.uData.keyIdentitySigner];
        // const device: string =
        //     await showTransactions(this.dialog, "Adding new device",
        //         async (progress: TProgress) => {
        //             c.spawnerInstance = this.uData.contact.spawnerInstance;
        //             c.data = this.uData;
        //             const now = new Date();
        //             const name = sprintf("recovered by %s at %d/%02d/%02d %02d:%02d",
        //                 this.uData.contact.alias,
        //                 now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes());
        //             const d = await c.createDevice(name, (p, s) => {
        //                 progress(25 + p / 2, s);
        //             }, signers);
        //             progress(75, "Updating Device List");
        //             await c.sendUpdate(signers);
        //             return d;
        //         });
        // if (device) {
        //     const url = window.location.protocol + "//" + window.location.host +
        //         this.location.prepareExternalUrl(device);
        //     this.dialog.open(ShowComponent, {data: url});
        // }
    }

    async contactUnlink(toDelete: CredentialStructBS) {
        // this.uData.contacts = this.uData.contacts.filter((c) => !c.credentialIID.equals(toDelete.credentialIID));
        // await storeCredential(this.dialog, "Unlinking contact " + toDelete.alias, this.uData);
    }

    async calypsoSearch(c: CredentialStructBS) {
        // await showTransactions(this.dialog, "Searching new secure data for " + c.alias.toLocaleUpperCase(),
        //     async (progress: TProgress) => {
        //         await c.updateOrConnect(this.uData.bc);
        //         progress(33, "searching new calypso");
        //         await this.uData.contact.calypso.read(c);
        //         progress(66, "Storing credential");
        //         await this.uData.save();
        //         progress(90, "Updating Calypso");
        //         this.updateCalypso();
        //     });
    }

    async renameGroup(g: DarcBS) {
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
                        await this.uData.user.executeTransactions(tx => {
                            g.evolveDarc(tx, {description: Buffer.from(result)})
                        })
                    })
            }
        })
    }

    async changeGroup(a: DarcInstance, filter: string) {
        Log.lvl3("change groups");
        await a.update();
        const tc = this.dialog.open(ManageDarcComponent,
            {
                data: {
                    darc: a.darc,
                    filter,
                    title: a.darc.description.toString(),
                },
                height: "400px",
                width: "400px",
            });
        tc.afterClosed().subscribe(async (result) => {
            if (result) {
                await showTransactions(this.dialog, "Updating Darc",
                    async (progress: TProgress) => {
                        progress(50, "Storing new DARC");
                        await a.evolveDarcAndWait(result, [this.uData.keyIdentitySigner], 5);
                    });
            }
        });
    }

    async actionUnlink(a: DarcInstance) {
        this.uData.contact.setActions((await this.uData.contact.getActions())
            .filter((aDI) => !aDI.id.equals(a.id)));
        await storeCredential(this.dialog, "Deleting action", this.uData);
    }

    async actionCreate() {
        const name = await this.askNameOfNewDarcInstance("Action");
        if (name === undefined) {
            return;
        }

        await showTransactions(this.dialog, "Creating new Action", async (progress: TProgress) => {
            progress(50, "Creating new action");
            await this.uData.user.executeTransactions(tx =>
                this.actions.create(tx, name, [this.uData.user.darcSigner]));
        });

    }

    async actionAdd() {
        await this.getDarcInstance(this.actions, "Action");
    }

    async actionShow(inst: DarcInstance) {
        this.dialog.open(DarcInstanceInfoComponent, {data: {inst}});
    }

    async groupUnlink(g: DarcInstance) {
        this.uData.contact.setGroups((await this.uData.contact.getGroups()).filter((gDI) => !gDI.id.equals(g.id)));
        await storeCredential(this.dialog, "Deleting action", this.uData);
    }

    async groupCreate() {
        const name = await this.askNameOfNewDarcInstance("Group");
        if (name === undefined) {
            return;
        }

        await showTransactions(this.dialog, "Creating new Group", async (progress: TProgress) => {
            progress(50, "Creating new DARCs");
            await this.uData.user.executeTransactions(tx => this.groups.create(tx, name), 1);
        });

    }

    async groupLink() {
        await this.getDarcInstance(this.groups, "Group");
    }

    async groupShow(inst: DarcInstance) {
        this.dialog.open(DarcInstanceInfoComponent, {data: {inst}});
    }

    async renameAction(g: DarcBS) {
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
                        await this.uData.user.executeTransactions(tx => {
                            g.evolveDarc(tx, {description: Buffer.from(result)})
                        })
                    })
            }
        })
    }

    /**
     * updateCalypso stores the keys and the FileBlobs in the class-variables so that the UI
     * can correctly show them.
     */
    updateCalypso() {
        this.calypsoOurKeys = Array.from(this.uData.contact.calypso.ours.keys());
        Array.from(this.uData.contact.calypso.others.keys()).forEach((oid) => {
            const other = this.uData.contacts.find((c) => c.credentialIID.equals(oid));
            const fbs = Array.from(this.uData.contact.calypso.others.get(oid))
                .map((sd) => FileBlob.fromBuffer(sd.plainData));
            this.calypsoOtherKeys.set(other, fbs);
        });
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
                    const inst = await DarcInstance.fromByzcoin(this.uData.bc, id);
                    if (dbs.getValue().some((a) => a.id.equals(id))) {
                        reject(`Given ${type} is already added under the name "${inst.darc.description}"`);
                    }
                    await this.uData.user.executeTransactions(tx => dbs.link(tx, inst.id));
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
    views = Data.views;
    showGroups: boolean;
    showViews: boolean;
    recoveryGroups: string[];

    constructor(
        public dialogRef: MatDialogRef<TransferCoinComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IUserCred) {
        this.showGroups = data.groups === undefined;
        this.showViews = data.view === undefined;
        if (this.showViews) {
            data.view = Data.views[0];
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
        @Inject(MAT_DIALOG_DATA) public data: { inst: DarcInstance }) {
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
