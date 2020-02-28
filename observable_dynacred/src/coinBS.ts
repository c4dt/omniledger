import {BehaviorSubject} from "rxjs";
import {flatMap, map, mergeAll} from "rxjs/operators";

import {Coin, CoinInstance} from "@dedis/cothority/byzcoin/contracts";

import {ObservableToBS} from "./observableHO";
import {Argument, InstanceID} from "@dedis/cothority/byzcoin";
import {BasicStuff} from "./user";
import * as Long from "long";
import {Transaction} from "./transaction";


export class CoinBS extends BehaviorSubject<CoinInstance> {

    constructor(private bs: BasicStuff,
                coin: BehaviorSubject<CoinInstance>) {
        super(coin.getValue());
        coin.subscribe(this);
    }

    public static async createCoinBS(bs: BasicStuff, coinID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<CoinBS> {
        if (coinID instanceof Buffer) {
            coinID = new BehaviorSubject(coinID);
        }
        const coinObs = coinID.pipe(
            flatMap(id => bs.inst.instanceBS(id)),
            mergeAll(),
            map(inst => CoinInstance.create(bs.bc as any, inst.key, inst.darcID, Coin.decode(inst.value)))
        );
        return new CoinBS(bs, await ObservableToBS(coinObs));
    }

    public transferCoins(tx: Transaction, dest: InstanceID, amount: Long) {
        tx.invoke(this.getValue().id, CoinInstance.contractID, CoinInstance.commandTransfer,
            [new Argument({name: CoinInstance.argumentDestination, value: dest}),
                new Argument({name: CoinInstance.argumentCoins, value: Buffer.from(amount.toBytesLE())})])
    }
}
