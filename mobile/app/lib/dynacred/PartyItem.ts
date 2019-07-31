// const ZXing = require("nativescript-zxing");
// const QRGenerator = new ZXing();
import ByzCoinRPC from "~/lib/cothority/byzcoin/byzcoin-rpc";
import Log from "~/lib/cothority/log";
import Instance from "~/lib/cothority/byzcoin/instance";
import { PopPartyInstance } from "~/lib/cothority/personhood/pop-party-instance";
import { PopDesc, PopPartyStruct } from "~/lib/cothority/personhood/proto";
import Long from "long";
import { Party } from "~/lib/dynacred/personhood-rpc";
// import {screen} from "tns-core-modules/platform";
// import {fromNativeSource, ImageSource} from "tns-core-modules/image-source";

export class PartyItem {

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

    static fromObject(bc: ByzCoinRPC, obj: any): PartyItem {
        const p = new PartyItem(new PopPartyInstance(bc, Instance.fromBytes(obj.party)));
        p.isOrganizer = obj.isOrganizer;
        return p;
    }

    isOrganizer = false;

    constructor(public partyInstance: PopPartyInstance) {
    }

    toObject(): any {
        return {
            isOrganizer: this.isOrganizer,
            party: this.partyInstance.toBytes(),
        };
    }

    toParty(rpc: ByzCoinRPC): Party{
        return new Party({
            roster: rpc.getConfig().roster,
            byzCoinID: rpc.genesisID,
            instanceID: this.partyInstance.id,
        })
    }
}