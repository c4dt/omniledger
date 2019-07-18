import {Observable} from "tns-core-modules/data/observable";
import {Contact} from "~/lib/Contact";
import {Log} from "~/lib/Log";
import {Data, gData} from "~/lib/Data";
import {topmost} from "tns-core-modules/ui/frame";
import {ItemEventData} from "tns-core-modules/ui/list-view";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {setupRecoverView} from "~/pages/setup/4-recover";
import {createQrcode, parseQRCode, scan} from "~/lib/Scan";
import {msgFailed} from "~/lib/ui/messages";
import {InstanceID} from "~/lib/cothority/byzcoin/ClientTransaction";
import {Credential, CredentialInstance} from "~/lib/cothority/byzcoin/contracts/CredentialInstance";
import {mainViewRegistered} from "~/main-page";

export class SetupRecoverView extends Observable {
    constructor() {
        super();

        this._threshold = gData.contact.recover.threshold;
        // Get current trusteesBuf
        this.updateTrustees().catch(e => {
            Log.catch(e);
        });
        try {
            this.set("qrcode", createQrcode(gData.recoveryRequest()));
        } catch(e){
            Log.catch(e);
        }
    }

    async updateTrustees() {
        let trustees: TrusteeSigner[] = [];
        gData.contact.recover.trustees.forEach(darciid => {
            let contacts = gData.friends.filter(c => c.darcInstance.iid.equals(darciid));
            if (contacts.length == 1) {
                trustees.push(new TrusteeSigner(contacts[0]));
            }
        });
        this._trustees = trustees;
    }

    set _threshold(t: number) {
        this.set("threshold", t);
    }

    get _threshold(): number{
        return this.get("threshold");
    }

    set _trustees(ts: TrusteeSigner[]) {
        this.set("trustees", ts);
    }

    get _trustees(): TrusteeSigner[] {
        let ts = this.get("trustees");
        if (!ts) {
            return [];
        } else {
            return <TrusteeSigner[]>ts;
        }
    }

    set _networkStatus(ns: string) {
        this.set("networkStatus", ns);
    }

    updateSignatures() {
        let width = this.get("trustees").length * 100 / gData.recoverySignatures.length;
        let color = "#308080;";
        if (width < 100) {
            color = "#a04040";
        }
        Log.print(1);
        topmost().getViewById("progress_bar_signatures").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
        Log.print(2);
    }

    async scanSignature() {
        try {
            let sig = await scan("Scan signature");
            try {
                await gData.recoveryStore(sig.text);
            } catch(e){
                return msgFailed("This is not a valid signature qrcode: " + e.toString());
            }
            if (this._trustees.length == 0) {
                let user = await gData.recoveryUser();
                Log.print("user is:", user, user.credentialIID);
                this._threshold = user.recover.threshold;
                let contacts = await Promise.all(user.recover.trustees.map(tiid =>
                    Contact.fromByzcoin(gData.bc, tiid)));
                this._trustees = contacts.map(c => new TrusteeSigner(c));
            }
            this.updateSignatures();
            if (gData.recoverySignatures.length >= this._threshold){
                await gData.recoverIdentity();
                await mainViewRegistered(null);
            }
        } catch(e){
            Log.catch(e, "scanSignature");
        }
    }
}

export class TrusteeSigner extends Observable {
    private _user: Contact;

    constructor(user: Contact) {
        super();

        this._user = user;
    }

    get signed(): string {
        return "\uf255";
    }

    set user(user: Contact) {
        this._user = user;
    }

    get alias(): string {
        return this._user.alias;
    }

    public async showTrustee(arg: ItemEventData) {
        topmost().navigate({
            moduleName: "pages/identity/contacts/actions/actions-page",
            context: this._user
        });
    }
}
