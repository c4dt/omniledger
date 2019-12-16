// tslint:disable-next-line
require("nativescript-nodeify");

import { Data } from "~/lib/dynacred";
import { Observable } from "tns-core-modules/data/observable";
import { ImageSource } from "tns-core-modules/image-source";
import { topmost } from "tns-core-modules/ui/frame";
import { isAdmin, noAttributes, uData } from "~/lib/byzcoin-def";
import { qrcodeIdentity } from "~/lib/qrcode";

export class AttributesViewModel extends Observable {

    constructor(d: Data) {
        super();
        this.userId = new Identity(d.alias, d.contact.email, d.contact.phone, d.contact.url, d.personhoodPublished);
    }

    set userId(value: Identity) {
        this.set("_admin", value);
    }

    get userId(): Identity {
        return this.get("_admin");
    }

    get qrcode(): ImageSource {
        return qrcodeIdentity(uData.contact);
    }

    get hasCoins(): boolean {
        return uData.coinInstance != null;
    }

    get isAdmin(): boolean {
        return isAdmin;
    }

    get noAttributes(): boolean {
        return noAttributes;
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

export class Identity {
    constructor(public alias: string, public email: string, public phone: string,
                public url: string,
                public publishPersonhood: boolean) {
    }
}
