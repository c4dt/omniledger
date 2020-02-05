// tslint:disable-next-line
require("nativescript-nodeify");

import { Contact } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { Observable } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view";
import { appRootMain } from "~/app-root";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed } from "~/lib/messages";
import { createQrcode, scan } from "~/lib/scan";

export class SetupRecoverView extends Observable {
    constructor() {
        super();

        this._threshold = uData.contact.recover.threshold;
        // Get current trusteesBuf
        this.updateTrustees().catch((e) => {
            Log.catch(e);
        });
        try {
            this.set("qrcode", createQrcode(uData.recoveryRequest()));
        } catch (e) {
            Log.catch(e);
        }
    }

    get _threshold(): number {
        return this.get("threshold");
    }

    set _threshold(t: number) {
        this.set("threshold", t);
    }

    get _trustees(): TrusteeSigner[] {
        const ts = this.get("trustees");
        if (!ts) {
            return [];
        } else {
            return ts as TrusteeSigner[];
        }
    }

    set _trustees(ts: TrusteeSigner[]) {
        this.set("trustees", ts);
    }

    set _networkStatus(ns: string) {
        this.set("networkStatus", ns);
    }

    async updateTrustees() {
        const trustees: TrusteeSigner[] = [];
        uData.contact.recover.trustees.forEach((darciid) => {
            const contacts = uData.contacts.filter((c) => c.darcInstance.id.equals(darciid));
            if (contacts.length === 1) {
                trustees.push(new TrusteeSigner(contacts[0]));
            }
        });
        this._trustees = trustees;
    }

    updateSignatures() {
        const width = this.get("trustees").length * 100 / uData.recoverySignatures.length;
        const color = width < 100 ? "$a04040;" : "#308080;";
        topmost().getViewById("progress_bar_signatures")
            .setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }

    async scanSignature() {
        try {
            const sig = await scan("Scan signature");
            try {
                await uData.recoveryStore(sig.text);
            } catch (e) {
                return msgFailed("This is not a valid signature qrcode: " + e.toString());
            }
            if (this._trustees.length === 0) {
                const user = await uData.recoveryUser();
                this._threshold = user.recover.threshold;
                const contacts = await Promise.all(user.recover.trustees.map((tiid) =>
                    Contact.fromByzcoin(uData.bc, tiid)));
                this._trustees = contacts.map((c: Contact) => new TrusteeSigner(c));
            }
            this.updateSignatures();
            if (uData.recoverySignatures.length >= this._threshold) {
                await uData.recoverIdentity();
                appRootMain();
            }
        } catch (e) {
            Log.catch(e, "scanSignature");
        }
    }
}

export class TrusteeSigner extends Observable {

    set user(user: Contact) {
        this._user = user;
    }

    get signed(): string {
        return "\uf255";
    }

    get alias(): string {
        return this._user.alias;
    }

    private _user: Contact;
    constructor(user: Contact) {
        super();

        this._user = user;
    }

    async showTrustee(arg: ItemEventData) {
        // tslint:disable:object-literal-sort-keys
        topmost().navigate({
            moduleName: "pages/identity/contacts/actions/actions-page",
            context: this._user,
        });
        // tslint:enable:object-literal-sort-keys
    }
}
