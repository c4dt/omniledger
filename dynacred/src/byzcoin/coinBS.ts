import * as Long from "long";
import { BehaviorSubject } from "rxjs";

import { Argument, InstanceID } from "@dedis/cothority/byzcoin";
import { CoinInstance } from "@dedis/cothority/byzcoin/contracts";

import { TransactionBuilder } from "./transactionBuilder";

export class CoinBS extends BehaviorSubject<CoinInstance> {

    constructor(coin: BehaviorSubject<CoinInstance>) {
        super(coin.getValue());
        coin.subscribe(this);
    }

    transferCoins(tx: TransactionBuilder, dest: InstanceID, amount: Long) {
        tx.invoke(this.getValue().id, CoinInstance.contractID, CoinInstance.commandTransfer,
            [new Argument({name: CoinInstance.argumentDestination, value: dest}),
                new Argument({name: CoinInstance.argumentCoins, value: Buffer.from(amount.toBytesLE())})]);
    }
}
