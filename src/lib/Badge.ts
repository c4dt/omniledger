import {Party} from './Party';
import {KeyPair} from './KeyPair';
import ByzCoinRPC from './cothority/byzcoin/byzcoin-rpc';
import {Data} from './Data';
import {Contact} from './Contact';

// const ZXing = require("nativescript-zxing");
// const QRGenerator = new ZXing();

export class Badge {

    constructor(public party: Party, public keypair: KeyPair) {
    }
    public mined = false;

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

    toObject(): any {
        return {
            party: this.party.toObject(),
            keypair: this.keypair.toObject(),
            mined: this.mined,
        };
    }

    async mine(d: Data, setProgress: Function = null) {
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
