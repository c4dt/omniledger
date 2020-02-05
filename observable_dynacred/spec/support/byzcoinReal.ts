import {InstanceID} from "@dedis/cothority/byzcoin";
import {IProof} from "src/instances";
import {
    IByzCoinAddTransaction,
    IByzCoinProof,
    ITransaction
} from "src/basics";
import ByzCoinRPC from "@dedis/cothority/byzcoin/byzcoin-rpc";

export class ByzCoinReal implements IByzCoinProof, IByzCoinAddTransaction {

    constructor(private bc: ByzCoinRPC){}

    async getProof(inst: InstanceID): Promise<IProof>{
        return this.bc.getProof(inst);
    }

    async addTransaction(tx: ITransaction): Promise<void>{

    };
}
