import * as Long from 'long';
import {Component, Inject} from '@angular/core';
import {Defaults} from '../lib/Defaults';
import StatusRPC from '../lib/cothority/status/status-rpc';
import {Log} from '../lib/cothority/log';
import {Data, gData} from '../lib/Data';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar, MatTabChangeEvent} from '@angular/material';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Private} from '../lib/KeyPair';
import SkipchainRPC from '../lib/cothority/skipchain/skipchain-rpc';
import {Contact} from '../lib/Contact';

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

    constructor(public dialog: MatDialog,
                private snackBar: MatSnackBar) {
        this.registerForm = new FormGroup({
            ephemeralKey: new FormControl('67e1ed9ba15a13ff5a481bf2ea72e835913b19138241f43870a7d7fd1074aa0d',
                Validators.pattern(/[0-9a-fA-F]{64}/)),
            darcID: new FormControl('80731f51af611a347009e513c89bc84b8883ddbf52c93a1c6a1c24a2715f8daa',
                Validators.pattern(/[0-9a-fA-F]{64}/)),
            alias: new FormControl('garfield')
        });

        gData.load().then(() => {
            this.gData = gData;
            this.isRegistered = gData.contact.isRegistered();
            this.updateContactForm();
            Log.print('gdata.key is', gData.keyIdentity._public.toHex());
        }).catch(e => {
            Log.catch(e);
        }).finally(() => {
            Log.print('finally');
            if (!gData.coinInstance && this.isRegistered) {
                Log.error('don\'t have a coin... Deleting data');
                this.isRegistered = false;
            }
            this.isLoaded = true;
        });
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
