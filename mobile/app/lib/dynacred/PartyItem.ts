import ByzCoinRPC from "@dedis/cothority/byzcoin/byzcoin-rpc";
import Instance from "@dedis/cothority/byzcoin/instance";
import { PopPartyInstance } from "@dedis/cothority/personhood/pop-party-instance";
import { Party } from "./personhood-rpc";

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

    toParty(rpc: ByzCoinRPC): Party {
        return new Party({
            byzCoinID: rpc.genesisID,
            instanceID: this.partyInstance.id,
            roster: rpc.getConfig().roster,
        });
    }
}
