// tslint:disable-next-line
require("nativescript-nodeify");

import { PartyItem, Public } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";

import { partyQrcode } from "~/lib/qrcode";
import { viewScanModel } from "~/pages/lab/personhood/scan-atts/scan-atts-page";

import crypto = require("crypto-browserify");
import { Observable } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { uData } from "~/lib/byzcoin-def";

export class ScanAttsView extends Observable {
    networkStatus: string;
    canAddParty: boolean;

    constructor(public party: PartyItem) {
        super();
    }

    get attendees(): Attendee[] {
        return this.keys.sort((a, b) => a.toHex().localeCompare(b.toHex()))
            .map((k) => new Attendee(k));
    }

    get keys(): Public[] {
        return this.party.partyInstance.getTmpAttendees().map((p) => new Public(p));
    }

    get hash(): string {
        const hash = crypto.createHash("sha256");
        const keys = this.keys.map((att) => {
            return att.toHex();
        });
        keys.sort();

        keys.forEach((a) => {
            hash.update(a);
        });
        return hash.digest().toString("hex").substr(0, 16);
    }

    get size(): number {
        return this.keys.length;
    }

    updateAll() {
        this.notifyPropertyChange("attendees", this.attendees);
        this.notifyPropertyChange("hash", this.hash);
    }

    async delete(key: Public) {
        await this.party.partyInstance.removeAttendee(key.point);
        await uData.save();
        this.updateAll();
    }

    async addAttendee(att: string) {
        const attPub = Public.fromHex(att);
        if (this.keys.find((k) => k.equal(attPub))) {
            return;
        }
        await this.party.partyInstance.addAttendee(attPub.point);
        await uData.save();
        this.updateAll();
    }

    async delAttendee(att: string) {
        const attPub = Public.fromHex(att);
        const pos = this.keys.findIndex((k) => k.equal(attPub));
        if (pos < 0) {
            return;
        }
        this.keys.splice(pos, 1);
        await uData.save();
        this.updateAll();
    }

    setProgress(text: string = "", width: number = 0) {
        if (width === 0) {
            this.set("networkStatus", null);
        } else {
            let color = "#308080;";
            if (width < 0) {
                color = "#a04040";
            }
            const pb = topmost().getViewById("progress_bar");
            if (pb) {
                pb.setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
            }
            this.set("networkStatus", text);
        }
    }
}

class Attendee extends Observable {
    constructor(public att: Public) {
        super();
    }

    async onTap() {
        Log.lvl2("tapped attendee", this.hex);
        const del = "Delete";
        const show = "Show Key";
        const cancel = "Cancel";
        const actions = [del, show];
        // tslint:disable:object-literal-sort-keys
        switch (await dialogs.action({
            title: "Work Key",
            cancelButtonText: cancel,
            actions,
            // tslint:enable:object-literal-sort-keys
        })) {
            case del:
                viewScanModel.delete(this.att);
                break;
            case show:
                topmost().showModal("pages/modal/modal-key", partyQrcode(this.att,
                    viewScanModel.party.partyInstance.popPartyStruct.description.name),
                    () => {Log.lvl3("done"); }, false, false, false);
                break;
        }
    }

    get hex(): string {
        return this.att.toHex();
    }
}
