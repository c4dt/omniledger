import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import Long from "long";
import DarcInstance, { newDarc } from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import { Log } from "@c4dt/cothority/log";
import { Contact } from "../../../lib/Contact";
import { Data, gData } from "../../../lib/Data";
import { Defaults } from "../../../lib/Defaults";
import { Private } from "../../../lib/KeyPair";
import { FileBlob } from "../../../lib/SecureData";
import { showSnack } from "../../../lib/ui/Ui";
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

    async createContact() {
        let creds = {alias: "", email: ""};
        if (Defaults.Testing) {
            const id = Date.now() % 1e6;
            creds = {alias: "test " + id, email: "test" + id + "@test.com"};
        }
        const ac = this.dialog.open(UserCredComponent, {
            data: creds,
            width: "400px",
        });
        ac.afterClosed().subscribe(async (result: IUserCred) => {
            if (result && result.alias !== "") {
                const sb = this.snackBar.open("Creating new user " + result.alias);
                let newUser: Data;
                try {
                    const ek = Private.fromRand();
                    newUser = await gData.createUser(result.alias, ek);
                    newUser.contact.email = result.email;
                    newUser.addContact(gData.contact);
                    await newUser.contact.sendUpdate([newUser.keyIdentitySigner]);
                    await gData.coinInstance.transfer(Long.fromNumber(100000), newUser.coinInstance.id,
                        [gData.keyIdentitySigner]);
                } catch (e) {
                    Log.catch(e);
                }
                sb.dismiss();

                if (newUser) {
                    gData.addContact(newUser.contact);
                    await gData.save();
                    this.dialog.open(CreateUserComponent, {
                        data: window.location.protocol + "//" + window.location.host + "/register?ephemeral=" +
                            newUser.keyIdentity._private.toHex(),
                        width: "400px",
                    });
                }
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
                    const sb = this.snackBar.open("Adding contact");
                    gData.addContact(await Contact.fromByzcoin(gData.bc, userID));
                    sb.dismiss();
                    await gData.save();
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
                    const sb = this.snackBar.open("Transferring coins");
                    await gData.coinInstance.transfer(coins, c.coinInstance.id, [gData.keyIdentitySigner]);
                    sb.dismiss();
                }
            }
        });
    }

    async contactDelete(toDelete: Contact) {
        gData.contacts = gData.contacts.filter((c) => !c.credentialIID.equals(toDelete.credentialIID));
        await gData.save();
    }

    async calypsoSearch(c: Contact) {
        const sb = this.snackBar.open("Searching new secure data for " + c.alias.toLocaleUpperCase());
        try {
            const sds = await gData.contact.calypso.read(c);
            await gData.save();
            this.updateCalypso();
        } catch (e) {
            Log.catch(e);
        }
        sb.dismiss();
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
            }
        });
    }

    async actionDelete(a: DarcInstance) {
        const sb = this.snackBar.open("Deleting action");
        try {
            gData.contact.setActions((await gData.contact.getActions()).filter((aDI) => !aDI.id.equals(a.id)));
            await this.updateActions();
        } catch (e) {
            Log.error(e);
        }
        sb.dismiss();
    }

    async actionCreate() {
        await this.diCreate("Action", async (newDI) => {
            gData.contact.setActions((await gData.contact.getActions()).concat(newDI));
            await this.updateActions();
        });
    }

    async diCreate(title: string, store: (newDI: DarcInstance) => {}) {
        const tc = this.dialog.open(CreateComponent, {data: title});
        tc.afterClosed().subscribe(async (result) => {
            if (result) {
                Log.lvl1("Creating new darcInstance with description:", result, title);
                const sb = this.snackBar.open("Creating new " + title);
                const di = await gData.contact.getDarcSignIdentity();
                const nd = newDarc([di], [di], Buffer.from(result));
                const ndInst = await gData.spawnerInstance.spawnDarc(gData.coinInstance, [gData.keyIdentitySigner], nd);
                await store(ndInst[0]);
                await gData.save();
                sb.dismiss();
            }
        });
    }

    async groupDelete(g: DarcInstance) {
        const sb = this.snackBar.open("Deleting action");
        try {
            gData.contact.setGroups((await gData.contact.getGroups()).filter((gDI) => !gDI.id.equals(g.id)));
            await gData.save();
            await this.updateGroups();
        } catch (e) {
            Log.error(e);
        }
        sb.dismiss();
    }

    async groupCreate() {
        await this.diCreate("Group", async (newDI) => {
            gData.contact.setGroups((await gData.contact.getGroups()).concat(newDI));
            await this.updateGroups();
        });
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
