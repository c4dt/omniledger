// const ZXing = require("nativescript-zxing");
// const QRGenerator = new ZXing();
import ByzCoinRPC from "@c4dt/cothority/byzcoin/byzcoin-rpc";
import Instance from "@c4dt/cothority/byzcoin/instance";
import { PopPartyInstance } from "@c4dt/cothority/personhood/pop-party-instance";
import { PopDesc, PopPartyStruct } from "@c4dt/cothority/personhood/proto";
import Long from "long";
// import {screen} from "tns-core-modules/platform";
// import {fromNativeSource, ImageSource} from "tns-core-modules/image-source";

export class Party {

    get state(): number {
        return this.partyInstance.popPartyStruct.state;
    }

    set state(s: number) {
        this.partyInstance.popPartyStruct.state = s;
    }

    get uniqueName(): string {
        return this.partyInstance.popPartyStruct.description.uniqueName;
    }
    static readonly preBarrier = 1;
    static readonly scanning = 2;
    static readonly finalized = 3;
    static readonly url = "https://pop.dedis.ch/qrcode/party";

    static fromObject(bc: ByzCoinRPC, obj: any): Party {
        const p = new Party(new PopPartyInstance(bc, Instance.fromBytes(obj.party)));
        p.isOrganizer = obj.isOrganizer;
        return p;
    }

    static fromDescription(name: string, purpose: string, location: string, date: Long): Party {
        const pd = new PopDesc({
            datetime: date,
            location,
            name,
            purpose,
        });
        const pps = new PopPartyStruct({
            attendees: null,
            description: pd,
            finalizations: null,
            miners: [],
            miningReward: Long.fromNumber(0),
            next: null,
            organizers: 1,
            previous: null,
            state: 1,
        });
        const ppi = new PopPartyInstance(null, null);
        ppi.popPartyStruct = pps;
        return new Party(ppi);
    }
    isOrganizer = false;

    constructor(public partyInstance: PopPartyInstance) {
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
            isOrganizer: this.isOrganizer,
            party: this.partyInstance.toBytes(),
        };
    }
}
