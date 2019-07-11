import { Location } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import Long from "long";

import { Argument, Instruction } from "@dedis/cothority/byzcoin";
import ClientTransaction from "@dedis/cothority/byzcoin/client-transaction";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import { Rule } from "@dedis/cothority/darc";
import Darc from "@dedis/cothority/darc/darc";
import ISigner from "@dedis/cothority/darc/signer";
import Log from "@dedis/cothority/log";
import CredentialsInstance from "@dedis/cothority/personhood/credentials-instance";

import { Contact } from "@c4dt/dynacred/Contact";
import { Data, gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";
import { Private } from "@c4dt/dynacred/KeyPair";
import { FileBlob } from "@c4dt/dynacred/SecureData";

import { showSnack } from "../../../lib/Ui";
import { BcviewerService } from "../../bcviewer/bcviewer.component";
import { ManageDarcComponent } from "../manage-darc";

@Component({
    selector: "app-contacts",
    styleUrls: ["./contacts.component.css"],
    templateUrl: "./contacts.component.html",
})
export class ContactsComponent implements OnInit {
    gData: Data;
    calypsoOurKeys: string[];
    calypsoOtherKeys: Map<Contact, FileBlob[]>;
    actions: DarcInstance[] = [];
    groups: DarcInstance[] = [];

    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private bcvs: BcviewerService,
        private location: Location,
    ) {
        this.gData = gData;
        this.calypsoOtherKeys = new Map();
        this.updateActions();
        this.updateGroups();
    }

    async updateActions() {
        this.actions = await gData.contact.getActions();
    }

    async updateGroups() {
        this.groups = await gData.contact.getGroups();
    }

    async ngOnInit() {
        Log.lvl3("init contacts");
        await this.updateActions();
        await this.updateGroups();
    }

    async createContact(view?: string) {
        const creds: IUserCred = {alias: "", email: "", view: "default", groups: []};
        if (Defaults.Testing) {
            const base = (view ? view : "test") + Date.now() % 1e6;
            creds.alias = base;
            creds.email = base + "@test.com";
        }
        const groups = await gData.contact.getGroups();
        creds.groups = groups.map((group) => group.darc.description.toString());
        const ac = this.dialog.open(UserCredComponent, {
            data: creds,
            width: "400px",
        });
        ac.afterClosed().subscribe(async (result: IUserCred) => {
            if (result && result.alias !== "") {
                await showSnack(this.snackBar, "Creating new user " + result.alias, async () => {
                    let newUser: Data;
                    const ek = Private.fromRand();
                    newUser = await gData.createUser(result.alias, ek);

                    if (newUser) {
                        newUser.contact.email = result.email;
                        if (view) {
                            newUser.contact.view = view;
                        }
                        newUser.addContact(gData.contact);

                        // Concatenate multiple instructions into one clientTransaction, so that
                        // the update is faster, as there won't be a wait for all transactions to
                        // go in.

                        const instructions: Instruction[] = [];
                        const signers: ISigner[][] = [];

                        // Update all chosen group-darcs to include the new user
                        const addedGroups = await Promise.all(result.groups.map(async (group) => {
                            const gInst = groups.find((g) => group === g.darc.description.toString());
                            const newDarc = gInst.darc.evolve();
                            const signID = (await newUser.contact.getDarcSignIdentity());
                            newDarc.rules.appendToRule(Darc.ruleSign, signID, Rule.OR);
                            const args = [new Argument({
                                name: DarcInstance.argumentDarc,
                                value: Buffer.from(Darc.encode(newDarc).finish()),
                            })];
                            const instr = Instruction.createInvoke(newDarc.getBaseID(),
                                DarcInstance.contractID, DarcInstance.commandEvolve, args);
                            instructions.push(instr);
                            signers.push([gData.keyIdentitySigner]);
                            return gInst;
                        }));

                        // Send enough coins to do 5 new devices
                        const coins = Long.fromNumber(5 * 100);
                        const argsTransfer = [
                            new Argument({name: CoinInstance.argumentCoins, value: Buffer.from(coins.toBytesLE())}),
                            new Argument({name: CoinInstance.argumentDestination, value: newUser.coinInstance.id}),
                        ];
                        instructions.push(Instruction.createInvoke(gData.coinInstance.id, CoinInstance.contractID,
                            CoinInstance.commandTransfer, argsTransfer));
                        signers.push([gData.keyIdentitySigner]);

                        // Update the new user
                        newUser.contact.setGroups(addedGroups);
                        newUser.contact.view = result.view;
                        const instrUpdate = Instruction.createInvoke(
                            newUser.contact.credentialIID,
                            CredentialsInstance.contractID,
                            CredentialsInstance.commandUpdate,
                            [new Argument({
                                name: CredentialsInstance.argumentCredential,
                                value: newUser.contact.credential.toBytes(),
                            })],
                        );
                        instructions.push(instrUpdate);
                        signers.push([newUser.keyIdentitySigner]);
                        const ctx = new ClientTransaction({instructions});
                        await ctx.updateCountersAndSign(gData.bc, signers);
                        await gData.bc.sendTransactionAndWait(ctx);

                        gData.addContact(newUser.contact);
                        await gData.save();
                        const url = this.location.prepareExternalUrl("/register?ephemeral=" +
                            newUser.keyIdentity._private.toHex());
                        let host = window.location.host;
                        if (Defaults.Testing) {
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
                await this.bcvs.updateBlocks();
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
                    await showSnack(this.snackBar, "Adding contact", async () => {
                        gData.addContact(await Contact.fromByzcoin(gData.bc, userID));
                        await gData.save();
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
                    await showSnack(this.snackBar, "Transferring coins", async () => {
                        await c.updateOrConnect(gData.bc);
                        await gData.coinInstance.transfer(coins, c.coinInstance.id, [gData.keyIdentitySigner]);
                    });
                    await this.bcvs.updateBlocks();
                }
            }
        });
    }

    async contactDelete(toDelete: Contact) {
        await showSnack(this.snackBar, "Deleting contact " + toDelete.alias, async () => {
            gData.contacts = gData.contacts.filter((c) => !c.credentialIID.equals(toDelete.credentialIID));
            await gData.save();
        });
        await this.bcvs.updateBlocks();
    }

    async calypsoSearch(c: Contact) {
        await showSnack(this.snackBar, "Searching new secure data for " + c.alias.toLocaleUpperCase(), async () => {
            await c.updateOrConnect(gData.bc);
            const sds = await gData.contact.calypso.read(c);
            await gData.save();
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
                await showSnack(this.snackBar, "Updating Darc", async () => {
                    await a.evolveDarcAndWait(result, [gData.keyIdentitySigner], 5);
                });
                await this.bcvs.updateBlocks();
            }
        });
    }

    async actionDelete(a: DarcInstance) {
        await showSnack(this.snackBar, "Deleting action", async () => {
            gData.contact.setActions((await gData.contact.getActions()).filter((aDI) => !aDI.id.equals(a.id)));
            await gData.save();
            await this.updateActions();
        });
        await this.bcvs.updateBlocks();
    }

    async actionCreate() {
        await this.diCreate("Action", async (newDI) => {
            gData.contact.setActions((await gData.contact.getActions()).concat(newDI));
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
                await showSnack(this.snackBar, "Creating new " + title, async () => {
                    const di = await gData.contact.getDarcSignIdentity();
                    const nd = Darc.createBasic([di], [di], Buffer.from(result));
                    const ndInst = await gData.spawnerInstance.spawnDarcs(gData.coinInstance,
                        [gData.keyIdentitySigner], nd);
                    await store(ndInst[0]);
                    await gData.save();
                });
                await this.bcvs.updateBlocks();
            }
        });
    }

    async groupDelete(g: DarcInstance) {
        await showSnack(this.snackBar, "Deleting action", async () => {
            gData.contact.setGroups((await gData.contact.getGroups()).filter((gDI) => !gDI.id.equals(g.id)));
            await gData.save();
            await this.updateGroups();
        });
        await this.bcvs.updateBlocks();
    }

    async groupCreate() {
        await this.diCreate("Group", async (newDI) => {
            gData.contact.setGroups((await gData.contact.getGroups()).concat(newDI));
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
        this.calypsoOurKeys = Array.from(gData.contact.calypso.ours.keys());
        Array.from(gData.contact.calypso.others.keys()).forEach((oid) => {
            const other = gData.contacts.find((c) => c.credentialIID.equals(oid));
            const fbs = Array.from(gData.contact.calypso.others.get(oid))
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
            await showSnack(this.snackBar, `Adding ${type}`, async () => {
                try {
                    const inst = await DarcInstance.fromByzcoin(gData.bc, id);
                    if (array.some((a) => a.darc.id.equals(id))) {
                        throw new Error(`Given ${type} is already added under the name "${inst.darc.description}"`);
                    }
                    array.push(inst);
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
}

@Component({
    selector: "app-user-cred",
    templateUrl: "user-cred.html",
})
export class UserCredComponent {
    views = Data.views;
    groupsAvail: string[];

    constructor(
        public dialogRef: MatDialogRef<TransferCoinComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IUserCred) {
        this.groupsAvail = data.groups;
        data.groups = [];
    }

    show(): void {
        Log.print(this.data.groups, this.data.view);
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
