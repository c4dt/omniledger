import { InstanceID } from "@dedis/cothority/byzcoin";
import ByzCoinRPC from "@dedis/cothority/byzcoin/byzcoin-rpc";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import SpawnerInstance from "@dedis/cothority/personhood/spawner-instance";
import { Contact } from "./Contact";
import { Data } from "./Data";
import { KeyPair } from "./KeyPair";
import { PartyItem } from "./PartyItem";

export class Badge {

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

    async mine(d: Data, sid: InstanceID) {
        this.mined = true;
        if (d.contact.isRegistered()) {
            return this.party.partyInstance.mine(d.keyPersonhood._private.scalar,
                d.coinInstance.id);
        } else {
            const darc = Contact.prepareUserDarc(d.keyIdentity._public.point,
                d.alias);
            // Create a coin and a darc
            await this.party.partyInstance.mine(d.keyPersonhood._private.scalar,
                undefined, darc);
            // Setting spawner-id
            d.contact.credential = Contact.prepareInitialCred(d.alias, d.keyIdentity._public, sid);
            d.spawnerInstance = await SpawnerInstance.fromByzcoin(d.bc, sid);
            // Use the coin and the darc to create a new user
            const ci = await CoinInstance.fromByzcoin(d.bc, CoinInstance.coinIID(darc.getBaseID()));
            await d.registerSelf(ci, [d.keyIdentitySigner]);
            // Now move over the coins
            await ci.update();
            await ci.transfer(ci.value, d.coinInstance.id, [d.keyIdentitySigner]);
        }
    }
}
