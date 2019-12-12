// tslint:disable-next-line
require("nativescript-nodeify");

import { Contact } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { Observable } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view";
import { uData } from "~/lib/byzcoin-def";
import { recoverView } from "~/pages/identity/recover/recover-page";

export class RecoverView extends Observable {
    constructor() {
        super();

        this._threshold = uData.contact.recover.threshold;
        // Get current trusteesBuf
        this.updateTrustees().catch((e) => {
            Log.catch(e);
        });
    }

    async updateTrustees() {
        const trustees: Trustee[] = [];
        uData.contact.recover.trustees.forEach((crediid) => {
            const contacts = uData.contacts.filter( (c) => c.credentialIID.equals(crediid));
            if (contacts.length === 1) {
                trustees.push(new Trustee(contacts[0]));
            }
        });
        this._maxValue = trustees.length;
        this._trustees = trustees;
        this._isTrustee = (await uData.searchRecovery()).length > 0;
        this._threshold = uData.contact.recover.threshold;
    }

    sliderChange(v: number) {
        uData.contact.recover.threshold = v;
        this._threshold = v;
        this._changed = true;
    }

    set _changed(c: boolean) {
        this.set("changed", c);
    }

    set _threshold(t: number) {
        this.set("threshold", t);
    }

    set _trustees(ts: Trustee[]) {
        this.set("trustees", ts);
    }

    set _maxValue(mv: number) {
        this.set("maxValue", mv);
    }

    set _networkStatus(ns: string) {
        this.set("networkStatus", ns);
    }

    set _isTrustee(it: boolean) {
        this.set("isTrustee", it);
    }
}

export class Trustee extends Observable {
    private _user: Contact;

    constructor(user: Contact) {
        super();

        this._user = user;
    }

    set user(user: Contact) {
        this._user = user;
    }

    get alias(): string {
        return this._user.alias;
    }

    async removeTrustee(arg: ItemEventData) {
        // tslint:disable:object-literal-sort-keys
        if (await dialogs.confirm({
            title: "Remove trustee",
            message: "Are you sure to remove trustee " + this._user.alias + " from your list? " +
                "He will be kept in your contacts list, but not be able to participate in recovery anymore.",
            okButtonText: "Remove",
            cancelButtonText: "Keep",
        })) {
            await uData.contact.recover.rmTrustee(this._user);
            uData.contact.recover.threshold -= 1;
            recoverView._changed = true;
            await recoverView.updateTrustees();
        }
    }

    async showTrustee(arg: ItemEventData) {
        topmost().navigate({
            moduleName: "pages/identity/contacts/actions/actions-page",
            context: this._user,
        });
    }
}
