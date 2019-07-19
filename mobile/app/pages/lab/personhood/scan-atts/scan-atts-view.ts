import { Public } from "~/lib/dynacred/KeyPair";
import { Party } from "~/lib/dynacred/Party";
import { partyQrcode } from "~/lib/qrcode";
import {viewScanModel} from "~/pages/lab/personhood/scan-atts/scan-atts-page";

const crypto = require("crypto-browserify");
import {Observable} from "tns-core-modules/data/observable";
import Log from "~/lib/cothority/log";
import {uData} from "~/user-data";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {topmost} from "tns-core-modules/ui/frame";

export class ScanAttsView extends Observable {
    networkStatus: string;
    canAddParty: boolean;

    constructor(public party: Party) {
        super();
    }

    get attendees(): Attendee[] {
        return this.keys.sort((a, b) => a.toHex().localeCompare(b.toHex()))
            .map(k => new Attendee(k));
    }

    get keys(): Public[] {
        return this.party.partyInstance.tmpAttendees.map(p => new Public(p));
    }

    get hash(): string {
        let hash = crypto.createHash("sha256");
        let keys = this.keys.map(att => {
            return att.toHex();
        });
        keys.sort();

        keys.forEach(a => {
            hash.update(a);
        });
        return hash.digest().toString('hex').substr(0, 16);
    }

    get size(): number {
        return this.keys.length;
    }

    updateAll(){
        this.notifyPropertyChange("attendees", this.attendees);
        this.notifyPropertyChange("hash", this.hash);
    }

    async delete(key: Public){
        await this.party.partyInstance.removeAttendee(key.point);
        await uData.save();
        this.updateAll();
    }

    async addAttendee(att: string) {
        let attPub = Public.fromHex(att);
        if (this.keys.find(k => k.equal(attPub))) {
            return;
        }
        await this.party.partyInstance.addAttendee(attPub.point);
        await uData.save();
        this.updateAll();
    }

    async delAttendee(att: string) {
        let attPub = Public.fromHex(att);
        let pos = this.keys.findIndex(k => k.equal(attPub));
        if (pos < 0) {
            return;
        }
        this.keys.splice(pos, 1);
        await uData.save();
        this.updateAll();
    }

    setProgress(text: string = "", width: number = 0) {
        if (width == 0) {
            this.set("networkStatus", null);
        } else {
            let color = "#308080;";
            if (width < 0) {
                color = "#a04040";
            }
            let pb = topmost().getViewById("progress_bar");
            if (pb) {
                pb.setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
            }
            this.set("networkStatus", text);
        }
    }
}

class Attendee extends Observable{
    constructor(public att: Public){
        super();
    }

    async onTap(){
        Log.lvl2("tapped attendee", this.hex);
        let del = "Delete";
        let show = "Show Key";
        let cancel = "Cancel";
        let actions = [del, show]
        switch(await dialogs.action({
            title: "Work Key",
            cancelButtonText: cancel,
            actions: actions,
        })){
            case del:
                viewScanModel.delete(this.att);
                break;
            case show:
                topmost().showModal("pages/modal/modal-key", partyQrcode(this.att,
                    viewScanModel.party.partyInstance.popPartyStruct.description.name),
                    ()=>{}, false, false, false);
                break;
        }
    }

    get hex(): string{
        return this.att.toHex();
    }
}
