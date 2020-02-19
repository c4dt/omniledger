import {BehaviorSubject} from "rxjs";
import {map} from "rxjs/operators";

import {Coin, CoinInstance} from "@dedis/cothority/byzcoin/contracts";
import {InstanceID} from "@dedis/cothority/byzcoin";

import {DoThings} from "./user";
import {CredentialAttributeBS} from "./credentialStructBS";
import {ObservableHO, ObservableToBS} from "./observableHO";
import {IInstance} from "./instances";


export class CoinBS extends BehaviorSubject<Coin> {
    public readonly inst: BehaviorSubject<IInstance>;

    constructor(private dt: DoThings,
                coin: BehaviorSubject<BehaviorSubject<IInstance>[]>) {
        super(Coin.decode(coin.getValue()[0].getValue().value));
        this.inst = new BehaviorSubject(coin.getValue()[0].getValue());
        coin.subscribe(co => co[0].subscribe(this.inst));
        this.inst.pipe(map(inst => Coin.decode(inst.value))).subscribe(this);
    }

    public static async fromScratch(dt: DoThings, coinID: CredentialAttributeBS<InstanceID>):
        Promise<CoinBS> {
        const oho = ObservableHO({
            source: coinID.pipe(
                map(ci => [ci])),
            convert: async (src) => ObservableToBS(await dt.inst.instanceObservable(src)),
            srcStringer: (src) => src.toString("hex"),
            stringToSrc: (str) => Buffer.from(str, "hex"),
        });
        return new CoinBS(dt, await ObservableToBS(oho))
    }

    async coinInstanceBS(): Promise<BehaviorSubject<CoinInstance>> {
        return ObservableToBS(this.inst.pipe(
            map(inst => this.coinInstance()))
        );
    }

    public coinInstance(): CoinInstance {
        return CoinInstance.create(this.dt.bc as any, this.inst.getValue().key,
            this.inst.getValue().darcID, this.getValue());
    }
}
