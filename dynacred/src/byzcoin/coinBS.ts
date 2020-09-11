import * as Long from "long";
import { BehaviorSubject } from "rxjs";

import { Argument, InstanceID } from "@dedis/cothority/byzcoin";
import { CoinInstance } from "@dedis/cothority/byzcoin/contracts";

import { TransactionBuilder } from "./transactionBuilder";

/**
 * CoinBS represents a coin with the new interface. Instead of relying on a synchronous interface,
 * this implementation allows for a more RxJS-style interface.
 */
export class CoinBS extends BehaviorSubject<CoinInstance> {

    constructor(coin: BehaviorSubject<CoinInstance>) {
        super(coin.getValue());
        coin.subscribe(this);
    }

    /**
     * Creates an instruction to transfer coins to another account.
     *
     * @param tx used to collect one or more instructions that will be bundled together and sent as one transaction
     * to byzcoin.
     * @param dest the destination account to store the coins in. The destination must exist!
     * @param amount how many coins to transfer.
     */
    transferCoins(tx: TransactionBuilder, dest: InstanceID, amount: Long) {
        tx.invoke(this.getValue().id, CoinInstance.contractID, CoinInstance.commandTransfer,
            [new Argument({name: CoinInstance.argumentDestination, value: dest}),
                new Argument({name: CoinInstance.argumentCoins, value: Buffer.from(amount.toBytesLE())})]);
    }
}
