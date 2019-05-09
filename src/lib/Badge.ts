import ByzCoinRPC from "@c4dt/cothority/byzcoin/byzcoin-rpc";
import { Contact } from "./Contact";
import { Data } from "./Data";
import { KeyPair } from "./KeyPair";
import { Party } from "./Party";

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
        const p = Party.fromObject(bc, obj.party);
        const kp = KeyPair.fromObject(obj.keypair);
        const b = new Badge(p, kp);
        b.mined = obj.mined;
        return b;
    }
    mined = false;

    constructor(public party: Party, public keypair: KeyPair) {
    }

    toObject(): any {
        return {
            keypair: this.keypair.toObject(),
            mined: this.mined,
            party: this.party.toObject(),
        };
    }

    async mine(d: Data, setProgress: () => {} = null) {
        this.mined = true;
        if (d.coinInstance) {
            return this.party.partyInstance.mine(d.keyPersonhood._private.scalar,
                d.coinInstance.id, null);
        } else {
            return this.party.partyInstance.mine(d.keyPersonhood._private.scalar,
                null, Contact.prepareUserDarc(d.keyIdentity._public.point,
                    d.alias));
        }
    }
}
