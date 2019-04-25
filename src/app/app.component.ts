import * as Long from 'long';
import {ChangeDetectorRef, Component, Inject} from '@angular/core';
import {Defaults} from '../lib/Defaults';
import StatusRPC from '../lib/cothority/status/status-rpc';
import {Log} from '../lib/cothority/log';
import {Data, gData} from '../lib/Data';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar, MatTabChangeEvent} from '@angular/material';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Private} from '../lib/KeyPair';
import SkipchainRPC from '../lib/cothority/skipchain/skipchain-rpc';
import {Contact} from '../lib/Contact';
import {ByzCoinRPC, InstanceID} from '../lib/cothority/byzcoin';
import {SecureData} from '../lib/SecureData';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'Welcome to DynaSent';
    nodes = [];
    gData: Data;
    registerForm: FormGroup;
    contactForm: FormGroup;
    isRegistered = false;
    isLoaded = false;
    blockCount = -1;

    calypsoOurKeys;
    calypsoOtherKeys;

    constructor(public dialog: MatDialog,
                private snackBar: MatSnackBar,
                private cd: ChangeDetectorRef) {
        this.registerForm = new FormGroup({
            ephemeralKey: new FormControl('9f247b0b1fcf1b1fafc8026a2c6d601835c50101715c7995b6599347af92c100',
                Validators.pattern(/[0-9a-fA-F]{64}/)),
            darcID: new FormControl('488371077baf2f18447f606a5d316c7c99a9f7f5ca5b70f48024f9ca6706c94f',
                Validators.pattern(/[0-9a-fA-F]{64}/)),
            alias: new FormControl('garfield')
        });

        if (true) {
            gData.load().then(() => {
                this.gData = gData;
                this.isRegistered = gData.contact.isRegistered();
                this.updateContactForm();
                this.calypsoOurKeys = Array.from(gData.contact.calypso.ours.keys());
                this.calypsoOtherKeys = Array.from(gData.contact.calypso.others.keys());
            }).catch(e => {
                Log.catch(e, 'couldnt get user');
            }).finally(() => {
                // Log.print('finally');
                // if (!gData.coinInstance && this.isRegistered) {
                //     Log.error('don\'t have a coin... Deleting data');
                //     this.isRegistered = false;
                // }
                this.isLoaded = true;
            });
        } else {
            this.isLoaded = true;
        }
    }

    updateContactForm() {
        this.contactForm = new FormGroup({
            alias: new FormControl(gData.contact.alias),
            email: new FormControl(gData.contact.email, Validators.email),
            phone: new FormControl(gData.contact.phone)
        });
    }

    async updateContact(event: Event) {
        gData.contact.alias = this.contactForm.controls.alias.value;
        gData.contact.email = this.contactForm.controls.email.value;
        gData.contact.phone = this.contactForm.controls.phone.value;
        await gData.contact.sendUpdate();
    }

    async addID(event: Event) {
        try {
            gData.bc = await ByzCoinRPC.fromByzcoin(Defaults.Roster, Defaults.ByzCoinID);
            this.gData = gData;
            if (this.registerForm.controls.ephemeralKey.valid) {
                Log.lvl1('creating user');
                const ekStr = this.registerForm.controls.ephemeralKey.value as string;
                const ek = Private.fromHex(ekStr);
                const did = this.registerForm.controls.darcID.value;
                if (this.registerForm.controls.darcID.valid && did.length === 64) {
                    Log.lvl2('creating FIRST user', gData.bc);
                    const d = await Data.createFirstUser(gData.bc, Buffer.from(did, 'hex'), ek.scalar,
                        this.registerForm.controls.alias.value);
                    gData.contact = d.contact;
                    gData.keyIdentity = d.keyIdentity;
                } else {
                    Log.lvl2('attaching to existing user and replacing password');
                    await gData.attachAndEvolve(ek);
                }
            }
        } catch (e) {
            Log.catch(e);
        }
        Log.lvl1('verifying registration');
        this.isRegistered = gData.contact.isRegistered();
        await gData.save();
        Log.lvl1('done registering');
        this.updateContactForm();
    }

    async createContact() {
        const sb = this.snackBar.open('Creating new user');
        let newUser: Data;
        try {
            const ek = Private.fromRand();
            newUser = await gData.createUser('test', ek);
        } catch (e) {
            Log.catch(e);
        }
        sb.dismiss();

        if (newUser) {
            gData.addContact(newUser.contact);
            await gData.save();
            this.dialog.open(CreateUserComponent, {
                width: '250px',
                data: newUser.keyIdentity._private.toHex(),
            });
        }
    }

    async addContact() {
        const ac = this.dialog.open(AddContactComponent);
        ac.afterClosed().subscribe(async result => {
            if (result) {
                Log.lvl1('Got new contact:', result);
                const userID = Buffer.from(result, 'hex');
                if (userID.length === 32) {
                    const sb = this.snackBar.open('Adding contact');
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
                data: {alias: c.alias}
            });
        tc.afterClosed().subscribe(async result => {
            if (result) {
                Log.lvl1('Got coins:', result);
                const coins = Long.fromString(result);
                if (coins.greaterThan(0)) {
                    const sb = this.snackBar.open('Transferring coins');
                    await gData.coinInstance.transfer(coins, c.coinInstance.id, [gData.keyIdentitySigner]);
                    sb.dismiss();
                }
            }
        });
    }

    async calypsoSearch(c: Contact) {
        Log.print('getting data of', c.darcSignIdentity.id);
        const sds = await gData.contact.calypso.read(c);
        await gData.save();
        Log.print('Got new data of others:', sds);
        this.calypsoOtherKeys = gData.contact.calypso.others.keys();
    }

    async calypsoAccess(key: string) {
    }

    async calypsoAddData() {
        const fileDialog = this.dialog.open(CalypsoUploadComponent, {
            width: '250px',
        });
        fileDialog.afterClosed().subscribe(async result => {
            const contacts = gData.contacts.map(c => c.darcSignIdentity.id);
            Log.print('storing file:', result);
            const key = await gData.contact.calypso.add(result, contacts);
            await gData.save();
            Log.print('file stored as', key);
            this.calypsoOurKeys = Array.from(gData.contact.calypso.ours.keys());
            Log.print('keys are', this.calypsoOurKeys);
        });
    }

    async calypsoUpdate(c: InstanceID) {
    }

    async calypsoDownload(c: InstanceID, sd: SecureData) {
    }

    tabChanged(tabChangeEvent: MatTabChangeEvent) {
        switch (tabChangeEvent.index) {
            case 0:
                break;
            case 1:
                break;
            case 2:
                break;
            case 3:
                this.update().catch(e => Log.catch(e));
                break;
        }
    }

    async update() {
        this.nodes = [];
        const list = Defaults.Roster.list;
        const srpc = new StatusRPC(Defaults.Roster);
        for (let i = 0; i < list.length; i++) {
            let node = list[i].description;
            try {
                const s = await srpc.getStatus(i);
                node += ': OK - Port:' + JSON.stringify(s.status.Generic.field.Port);
            } catch (e) {
                node += ': Failed';
            }
            this.nodes.push(node);
        }
        this.nodes.sort();
        await gData.bc.updateConfig();
        const skiprpc = new SkipchainRPC(gData.bc.getConfig().roster);
        const last = await skiprpc.getLatestBlock(gData.bc.genesisID);
        this.blockCount = last.index;
    }
}

@Component({
    selector: 'app-create-user',
    templateUrl: 'create-user.html',
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
    selector: 'app-add-contact',
    templateUrl: 'add-contact.html',
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

export interface CoinTransfer {
    coins: string;
    alias: string;
}

@Component({
    selector: 'app-transfer-coin',
    templateUrl: 'transfer-coin.html',
})
export class TransferCoinComponent {

    constructor(
        public dialogRef: MatDialogRef<TransferCoinComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CoinTransfer) {
    }

    cancel(): void {
        this.dialogRef.close();
    }
}

@Component({
    selector: 'app-calypso-upload',
    templateUrl: 'calypso-upload.html',
})
export class CalypsoUploadComponent {
    file: Buffer;

    constructor(
        public dialogRef: MatDialogRef<CalypsoUploadComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Buffer) {
    }

    cancel(): void {
        this.dialogRef.close();
    }

    async handleFileInput(e: Event) {
        this.file = Buffer.from(await (await new Response(((e.target as any).files[0] as File).slice())).arrayBuffer());
    }
}
