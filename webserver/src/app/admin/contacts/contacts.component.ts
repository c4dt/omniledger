import { Location } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import Long from "long";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import Darc from "@dedis/cothority/darc/darc";
import Log from "@dedis/cothority/log";
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
        let creds = {alias: "", email: ""};
        if (Defaults.Testing) {
            const base = ( view ? view : "test" ) + Date.now() % 1e6;
            creds = {alias: base, email: base + "@test.com"};
        }
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
                    newUser.contact.email = result.email;
                    if (view) {
                        newUser.contact.view = view;
                    }
                    newUser.addContact(gData.contact);
                    await newUser.contact.sendUpdate([newUser.keyIdentitySigner]);
                    await gData.coinInstance.transfer(Long.fromNumber(100000), newUser.coinInstance.id,
                        [gData.keyIdentitySigner]);

                    if (newUser) {
                        gData.addContact(newUser.contact);
                        await gData.save();
                        const url = this.location.prepareExternalUrl("/register?ephemeral=" +
                            newUser.keyIdentity._private.toHex());
                        let host = window.location.host;
                        if (Defaults.Testing) {
                            if (host.match(/local[1-9]{0,1}/)) {
                                let index = parseInt(host.slice(5, 6), 10);
                                if (!index) {
                                    index = 0;
                                }
                                host = "local" + (index + 1) + ":4200";
                            }
                        }
                        this.dialog.open(CreateUserComponent, {
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
            const sds = await gData.contact.calypso.read(c);
            await gData.save();
            this.updateCalypso();
        });
        await this.bcvs.updateBlocks();
    }

    async changeGroups(a: DarcInstance, filter: string) {
        Log.lvl3("change groups");
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
}

@Component({
    selector: "app-user-cred",
    templateUrl: "user-cred.html",
})
export class UserCredComponent {

    constructor(
        public dialogRef: MatDialogRef<TransferCoinComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IUserCred) {
    }

    cancel(): void {
        this.dialogRef.close();
    }
}

@Component({
    selector: "app-create-user",
    templateUrl: "create-user.html",
})
export class CreateUserComponent {

    constructor(
        public dialogRef: MatDialogRef<CreateUserComponent>,
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
