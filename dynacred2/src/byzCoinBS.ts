import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {IDataBase} from "./genesis";

export class ByzCoinBS {
    constructor(
        public bc: ByzCoinRPC,
        public db: IDataBase,
    ) {
    }
}
