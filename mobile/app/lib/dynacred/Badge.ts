import ByzCoinRPC from "~/lib/cothority/byzcoin/byzcoin-rpc";
import Log from "~/lib/cothority/log";
import { Contact } from "./Contact";
import { Data } from "./Data";
import { KeyPair } from "./KeyPair";
import { PartyItem } from "./PartyItem";

// const ZXing = require("nativescript-zxing");
// const QRGenerator = new ZXing();

export class Badge {

    // get qrcode(): ImageSource {
    //     const sideLength = screen.mainScreen.widthPixels / 4;
    //     const qrcode = QRGenerator.createBarcode({
    //         encode: this.party.partyInstance.popPartyStruct.description.name,
    //         format: ZXing.QR_CODE,
    //         height: sideLength,
    //         width: sideLength
    //     });
    //     return fromNativeSource(qrcode);
    // }

    static fromObject(bc: ByzCoinRPC, obj: any): Badge {
        const p = PartyItem.fromObject(bc, obj.party);
        const kp = KeyPair.fromObject(obj.keypair);
        const b = new Badge(p, kp);
        b.mined = obj.mined;
        return b;
    }
    mined = false;

    constructor(public party: PartyItem, public keypair: KeyPair) {
    }

    toObject(): any {
        return {
            keypair: this.keypair.toObject(),
            mined: this.mined,
            party: this.party.toObject(),
        };
    }

    async mine(d: Data, setProgress: (text?: string, width?: number) => void = null) {
        this.mined = true;
        if (d.contact.isRegistered()) {
            return this.party.partyInstance.mine(d.keyPersonhood._private.scalar,
                d.coinInstance.id, null);
        } else {
            return this.party.partyInstance.mine(d.keyPersonhood._private.scalar,
                null, Contact.prepareUserDarc(d.keyIdentity._public.point,
                    d.alias));
        }
    }
}
