import ByzCoinRPC from "~/lib/cothority/byzcoin/byzcoin-rpc";
import CoinInstance from "~/lib/cothority/byzcoin/contracts/coin-instance";
import Log from "~/lib/cothority/log";
import SpawnerInstance from "~/lib/cothority/personhood/spawner-instance";
import { Defaults } from "~/lib/dynacred/Defaults";
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
            const darc = Contact.prepareUserDarc(d.keyIdentity._public.point,
                d.alias);
            // Create a coin and a darc
            await this.party.partyInstance.mine(d.keyPersonhood._private.scalar,
                null, darc);
            // Setting spawner-id
            d.contact.credential = Contact.prepareInitialCred(d.alias, d.keyIdentity._public, Defaults.SpawnerID,
                null, null);
            d.spawnerInstance = await SpawnerInstance.fromByzcoin(d.bc, Defaults.SpawnerID);
            // Use the coin and the darc to create a new user
            const ci = await CoinInstance.fromByzcoin(d.bc, CoinInstance.coinIID(darc.getBaseID()));
            await d.registerSelf(ci, [d.keyIdentitySigner]);
            // Now move over the coins
            await ci.update();
            await ci.transfer(ci.value, d.coinInstance.id, [d.keyIdentitySigner]);
        }
    }
}
