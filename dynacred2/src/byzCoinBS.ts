import {ByzCoinRPC} from "@dedis/cothority/byzcoin";

import {IDataBase, Instances} from "./byzcoin/instances";

export class ByzCoinBS {
    constructor(
        public bc: ByzCoinRPC,
        public db: IDataBase,
        public inst: Instances
    ) {
    }
}
