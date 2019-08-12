import { Location } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";

import { Contact, Data, FileBlob, Private } from "@c4dt/dynacred";

import { Argument, Instruction } from "@dedis/cothority/byzcoin";
import ClientTransaction from "@dedis/cothority/byzcoin/client-transaction";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import { Rule } from "@dedis/cothority/darc";
import Darc from "@dedis/cothority/darc/darc";
import ISigner from "@dedis/cothority/darc/signer";
import Log from "@dedis/cothority/log";
import CredentialsInstance from "@dedis/cothority/personhood/credentials-instance";
import Long from "long";

import { showTransactions, storeCredential, TProgress } from "../../../lib/Ui";
import { BcviewerService } from "../../bcviewer/bcviewer.component";
import { UserData } from "../../user-data.service";
import { ManageDarcComponent } from "../manage-darc";

@Component({
    selector: "app-contacts",
    styleUrls: ["./contacts.component.css"],
    templateUrl: "./contacts.component.html",
})
export class ContactsComponent implements OnInit {
    calypsoOurKeys: string[];
    calypsoOtherKeys: Map<Contact, FileBlob[]>;
    actions: DarcInstance[] = [];
    groups: DarcInstance[] = [];

    constructor(
        protected dialog: MatDialog,
        private snackBar: MatSnackBar,
        private bcvs: BcviewerService,
        private location: Location,
        public uData: UserData,
    ) {
        this.calypsoOtherKeys = new Map();
    }

    async updateActions() {
        this.actions = await this.uData.contact.getActions();
    }

    async updateGroups() {
        this.groups = await this.uData.contact.getGroups();
    }

    async ngOnInit() {
        Log.lvl3("init contacts");
        await this.updateActions();
        await this.updateGroups();
    }

    /**
     * Pops up a dialog and asks for the alias and email of the new user to be created.
     * If any of the view or groups parameter is the non-default, it will not be asked
     * by the dialog.
     *
     * @param view - must be either undefined or one of Data.views
     * @param groups - must be either undefined or one of the user's available groups
     */
    async createContact(view?: string, groups?: string[]) {
        const groupsInstAvail = await this.uData.contact.getGroups();
        const groupsAvail = groupsInstAvail.map((g) => g.darc.description.toString());
        const creds: IUserCred = {alias: "", email: "", view, groups, groupsAvail};
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
                        const ek = Private.fromRand();
                        progress(30, "Creating User Instance");
                        const nu = await this.uData.createUser(result.alias, ek);
                        progress(-50, "Collecting User Information");

                        if (nu) {
                            nu.contact.email = result.email;
                            if (result.view !== "") {
                                Log.lvl2("Setting default view of", result.view);
                                nu.contact.view = result.view;
                            }
                            nu.addContact(this.uData.contact);

                            // Concatenate multiple instructions into one clientTransaction, so that
                            // the update is faster, as there won't be a wait for all transactions to
                            // go in.

                            const instructions: Instruction[] = [];
                            const signers: ISigner[][] = [];

                            // Update all chosen group-darcs to include the new user
                            const addedGroups = await Promise.all(result.groups.map(async (group) => {
                                Log.lvl2("Adding group", group, "to user", result.alias);
                                const gInst = groupsInstAvail.find((g) => group === g.darc.description.toString());
                                await gInst.update();
                                const newDarc = gInst.darc.evolve();
                                const signID = (await nu.contact.getDarcSignIdentity());
                                newDarc.rules.appendToRule(Darc.ruleSign, signID, Rule.OR);
                                const args = [new Argument({
                                    name: DarcInstance.argumentDarc,
                                    value: Buffer.from(Darc.encode(newDarc).finish()),
                                })];
                                const instr = Instruction.createInvoke(newDarc.getBaseID(),
                                    DarcInstance.contractID, DarcInstance.commandEvolve, args);
                                instructions.push(instr);
                                signers.push([this.uData.keyIdentitySigner]);
                                return gInst;
                            }));

                            // Send enough coins to do 5 new devices
                            const coins = Long.fromNumber(5 * 100);
                            const argsTransfer = [
                                new Argument({name: CoinInstance.argumentCoins, value: Buffer.from(coins.toBytesLE())}),
                                new Argument({name: CoinInstance.argumentDestination, value: nu.coinInstance.id}),
                            ];
                            instructions.push(Instruction.createInvoke(this.uData.coinInstance.id,
                                CoinInstance.contractID,
                                CoinInstance.commandTransfer, argsTransfer));
                            signers.push([this.uData.keyIdentitySigner]);

                            // Update the new user
                            nu.contact.setGroups(addedGroups);
                            nu.contact.view = result.view;
                            const instrUpdate = Instruction.createInvoke(
                                nu.contact.credentialIID,
                                CredentialsInstance.contractID,
                                CredentialsInstance.commandUpdate,
                                [new Argument({
                                    name: CredentialsInstance.argumentCredential,
                                    value: nu.contact.credential.toBytes(),
                                })],
                            );
                            instructions.push(instrUpdate);
                            signers.push([nu.keyIdentitySigner]);
                            const ctx = new ClientTransaction({instructions});
                            await ctx.updateCountersAndSign(this.uData.bc, signers);
                            progress(60, "Updating User Information");
                            await this.uData.bc.sendTransactionAndWait(ctx);

                            progress(80, "Adding User to Contacts");
                            this.uData.addContact(nu.contact);
                            await this.uData.save();
                        }
                        return nu;
                    });
                const url = this.location.prepareExternalUrl("/register?ephemeral=" +
                    newUser.keyIdentity._private.toHex());
                let host = window.location.host;
                if (false) {
                    if (host.match(/local[1-9]?/)) {
                        let index = parseInt(host.slice(5, 6), 10);
                        if (!index) {
                            index = 0;
                        }
                        host = "local" + (index + 1) + ":4200";
                    }
                }
                this.dialog.open(SignupLinkComponent, {
                    data: `${window.location.protocol}//${host + url}`,
                    width: "400px",
                });
            }
        });
    }

    async addContact() {
        const ac = this.dialog.open(AddContactComponent);
        ac.afterClosed().subscribe(async (result) => {
            if (result) {
                Log.lvl1("Got new contact:", result);
                const userID = Buffer.from(result, "hex");
                if (userID.length === 32) {
                    await storeCredential(this.dialog, "Adding contact", async () => {
                        this.uData.addContact(await Contact.fromByzcoin(this.uData.bc, userID));
                        await this.uData.save();
                    });
                    await this.bcvs.updateBlocks();
                }
            }
        });
    }

    async transferCoin(c: Contact) {
        const tc = this.dialog.open(TransferCoinComponent,
            {
                data: {alias: c.alias},
            });
        tc.afterClosed().subscribe(async (result) => {
            if (result) {
                Log.lvl1("Got coins:", result);
                const coins = Long.fromString(result);
                if (coins.greaterThan(0)) {
                    await showTransactions(this.dialog, "Transferring coins",
                        async (progress: TProgress) => {
                            await c.updateOrConnect(this.uData.bc);
                            progress(50, "Transferring Coins");
                            await this.uData.coinInstance.transfer(coins, c.coinInstance.id,
                                [this.uData.keyIdentitySigner]);
                        });
                    await this.bcvs.updateBlocks();
                }
            }
        });
    }

    async contactDelete(toDelete: Contact) {
        await storeCredential(this.dialog, "Deleting contact " + toDelete.alias, async () => {
            this.uData.contacts = this.uData.contacts.filter((c) => !c.credentialIID.equals(toDelete.credentialIID));
            await this.uData.save();
        });
        await this.bcvs.updateBlocks();
    }

    async calypsoSearch(c: Contact) {
        await showTransactions(this.dialog, "Searching new secure data for " + c.alias.toLocaleUpperCase(),
            async (progress: TProgress) => {
                await c.updateOrConnect(this.uData.bc);
                progress(33, "searching new calypso");
                const sds = await this.uData.contact.calypso.read(c);
                progress(66, "Storing credential");
                await this.uData.save();
                progress(90, "Updating Calypso");
                this.updateCalypso();
            });
        await this.bcvs.updateBlocks();
    }

    async changeGroups(a: DarcInstance, filter: string) {
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
                await this.bcvs.updateBlocks();
            }
        });
    }

    async actionDelete(a: DarcInstance) {
        await storeCredential(this.dialog, "Deleting action", async () => {
            this.uData.contact.setActions((await this.uData.contact.getActions())
                .filter((aDI) => !aDI.id.equals(a.id)));
            await this.uData.save();
            await this.updateActions();
        });
        await this.bcvs.updateBlocks();
    }

    async actionCreate() {
        await this.diCreate("Action", async (newDI) => {
            this.uData.contact.setActions((await this.uData.contact.getActions()).concat(newDI));
            await this.updateActions();
        });
        await this.bcvs.updateBlocks();
    }

    async actionAdd() {
        this.darcInstanceAdd(this.actions, "Action");
    }

    async actionShow(inst: DarcInstance) {
        this.dialog.open(DarcInstanceInfoComponent, {data: {inst}});
    }

    async diCreate(title: string, store: (newDI: DarcInstance) => {}) {
        const tc = this.dialog.open(CreateComponent, {data: title});
        tc.afterClosed().subscribe(async (result) => {
            if (result) {
                Log.lvl1("Creating new darcInstance with description:", result, title);
                await showTransactions(this.dialog, "Creating new " + title,
                    async (progress: TProgress) => {
                        progress(-30, "Getting Identity");
                        const di = await this.uData.contact.getDarcSignIdentity();
                        const nd = Darc.createBasic([di], [di], Buffer.from(result));
                        progress(60, "Creating new DARCs");
                        const ndInst = await this.uData.spawnerInstance.spawnDarcs(this.uData.coinInstance,
                            [this.uData.keyIdentitySigner], nd);
                        await store(ndInst[0]);
                        progress(90, "Storing credential");
                        await this.uData.save();
                    },
                )
                ;
                await this.bcvs.updateBlocks();
            }
        });
    }

    async groupDelete(g: DarcInstance) {
        await storeCredential(this.dialog, "Deleting action", async () => {
            this.uData.contact.setGroups((await this.uData.contact.getGroups()).filter((gDI) => !gDI.id.equals(g.id)));
            await this.uData.save();
            await this.updateGroups();
        });
        await this.bcvs.updateBlocks();
    }

    async groupCreate() {
        await this.diCreate("Group", async (newDI) => {
            this.uData.contact.setGroups((await this.uData.contact.getGroups()).concat(newDI));
            await this.updateGroups();
        });
        await this.bcvs.updateBlocks();
    }

    async groupAdd() {
        this.darcInstanceAdd(this.groups, "Group");
    }

    async groupShow(inst: DarcInstance) {
        this.dialog.open(DarcInstanceInfoComponent, {data: {inst}});
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

    private async darcInstanceAdd(array: DarcInstance[], type: string) {
        this.dialog.open(DarcInstanceAddComponent, {data: {type}})
            .afterClosed().subscribe(async (darcID: string | undefined) => {
            if (darcID === "" || darcID === undefined) {
                return; // cancel yield empty string, escape yield undef
            }
            const id = Buffer.from(darcID, "hex");

            // TODO might be movable to AsyncValidator
            await storeCredential(this.dialog, `Adding ${type}`, async () => {
                try {
                    const inst = await DarcInstance.fromByzcoin(this.uData.bc, id);
                    if (array.some((a) => a.darc.id.equals(id))) {
                        throw new Error(`Given ${type} is already added under the name "${inst.darc.description}"`);
                    }
                    array.push(inst);
                    await this.uData.save();
                } catch (e) {
                    if (e.message === `key not in proof: ${darcID}`) {
                        e = new Error(`Given ${type}'s ID was not found`);
                    }
                    throw e;
                }
            });
        });
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

    cancel(): void {
        this.dialogRef.close();
    }
}

export interface IUserCred {
    alias: string;
    email: string;
    view: string;
    groups: string[];
    groupsAvail: string[];
}

@Component({
    selector: "app-user-cred",
    templateUrl: "user-cred.html",
})
export class UserCredComponent {
    views = Data.views;
    showGroups: boolean;
    showViews: boolean;

    constructor(
        public dialogRef: MatDialogRef<TransferCoinComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IUserCred) {
        this.showGroups = data.groups === undefined;
        this.showViews = data.view === undefined;
        if (this.showViews) {
            data.view = Data.views[0];
        }
        data.groups = [];
    }

    show(): void {
        Log.lvl1(this.data.groups, this.data.view);
    }

    cancel(): void {
        this.dialogRef.close();
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

    cancel(): void {
        this.dialogRef.close();
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

    cancel(): void {
        this.dialogRef.close();
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
