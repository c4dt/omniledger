// const ZXing = require("nativescript-zxing");
// const QRGenerator = new ZXing();
import {PopPartyInstance} from './cothority/personhood/pop-party-instance';
import {PopDesc, PopPartyStruct} from './cothority/personhood/proto';
import * as Long from 'long';
import ByzCoinRPC from './cothority/byzcoin/byzcoin-rpc';
import Instance from './cothority/byzcoin/instance';
// import {screen} from "tns-core-modules/platform";
// import {fromNativeSource, ImageSource} from "tns-core-modules/image-source";

export class Party {

    constructor(public partyInstance: PopPartyInstance) {
    }

    get state(): number {
        return this.partyInstance.popPartyStruct.state;
    }

    set state(s: number) {
        this.partyInstance.popPartyStruct.state = s;
    }

    get uniqueName(): string {
        return this.partyInstance.popPartyStruct.description.uniqueName;
    }
    static readonly PreBarrier = 1;
    static readonly Scanning = 2;
    static readonly Finalized = 3;
    static readonly url = 'https://pop.dedis.ch/qrcode/party';
    isOrganizer = false;

    static fromObject(bc: ByzCoinRPC, obj: any): Party {
        const p = new Party(new PopPartyInstance(bc, Instance.fromBytes(obj.party)));
        p.isOrganizer = obj.isOrganizer;
        return p;
    }

    static fromDescription(name: string, purpose: string, location: string, date: Long): Party {
        const pd = new PopDesc({
            name,
            purpose,
            datetime: date,
            location
        });
        const pps = new PopPartyStruct({
            state: 1,
            organizers: 1,
            finalizations: null,
            description: pd,
            attendees: null,
            miners: [],
            miningReward: Long.fromNumber(0),
            previous: null,
            next: null
        });
        const ppi = new PopPartyInstance(null, null);
        ppi.popPartyStruct = pps;
        return new Party(ppi);
    }

    // qrcode(key: Public): ImageSource {
    //     let url = Party.url + "?public=" + key.toHex();
    //     url += "&name=" + this.partyInstance.popPartyStruct.description.name;
    //     const sideLength = screen.mainScreen.widthPixels / 4;
    //     const qrcode = QRGenerator.createBarcode({
    //         encode: url,
    //         format: ZXing.QR_CODE,
    //         height: sideLength,
    //         width: sideLength
    //     });
    //     return fromNativeSource(qrcode);
    // }

    toObject(): any {
        return {
            party: this.partyInstance.toBytes(),
            isOrganizer: this.isOrganizer,
        };
    }
}
