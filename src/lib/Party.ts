import {Public} from "./KeyPair";
// import {screen} from "tns-core-modules/platform";
// import {fromNativeSource, ImageSource} from "tns-core-modules/image-source";

const ZXing = require("nativescript-zxing");
const QRGenerator = new ZXing();
import {Log} from "./Log";
import {PopPartyInstance} from "./cothority/byzcoin/contracts/pop-party/pop-party-instance";
import {PopDesc, PopPartyStruct} from "./cothority/byzcoin/contracts/pop-party/proto";
import * as Long from "long";
import ByzCoinRPC from "./cothority/byzcoin/byzcoin-rpc";
import Instance, {InstanceID} from "./cothority/byzcoin/instance";
import DarcInstance from "./cothority/byzcoin/contracts/darc-instance";

export class Party {
    static readonly PreBarrier = 1;
    static readonly Scanning = 2;
    static readonly Finalized = 3;
    static readonly url = "https://pop.dedis.ch/qrcode/party";
    isOrganizer: boolean = false;

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
            party: this.partyInstance.toBytes(),
            isOrganizer: this.isOrganizer,
        }
    }

    get state(): number {
        return this.partyInstance.popPartyStruct.state;
    }

    set state(s: number) {
        this.partyInstance.popPartyStruct.state = s;
    }

    static fromObject(bc: ByzCoinRPC, obj: any): Party {
        let p = new Party(new PopPartyInstance(bc, Instance.fromBytes(obj.party)));
        p.isOrganizer = obj.isOrganizer;
        return p;
    }

    get uniqueName(): string {
        return this.partyInstance.popPartyStruct.description.uniqueName;
    }

    static fromDescription(name: string, purpose: string, location: string, date: Long): Party {
        let pd = new PopDesc({
            name: name,
            purpose: purpose,
            datetime: date,
            location: location
        });
        let pps = new PopPartyStruct({
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
        let ppi = new PopPartyInstance(null, null);
        ppi.popPartyStruct = pps;
        return new Party(ppi);
    }
}
