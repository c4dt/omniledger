import {BehaviorSubject} from "rxjs";
import {ObservableToBS} from "./observableHO";
import {flatMap, map, mergeAll, tap} from "rxjs/operators";
import {Darc, IIdentity, Rule, Rules} from "@dedis/cothority/darc";
import {Argument, InstanceID} from "@dedis/cothority/byzcoin";
import {DarcInstance} from "@dedis/cothority/byzcoin/contracts";
import {IInstance} from "./instances";
import {BasicStuff} from "./user";
import {Transaction} from "./transaction";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";
import Log from "@c4dt/cothority/log";

export class DarcsBS extends BehaviorSubject<DarcBS[]> {
    constructor(sbs: BehaviorSubject<DarcBS[]>) {
        super(sbs.getValue());
        sbs.subscribe(this);
    }

    public static async createDarcsBS(bs: BasicStuff, aisbs: BehaviorSubject<InstanceID[]>): Promise<DarcsBS> {
        const dbs = await ObservableToBS(aisbs.pipe(
            flatMap(ais => Promise.all(ais
                .map(iid => DarcBS.createDarcBS(bs, iid))))));
        return new DarcsBS(dbs);
    }
}

export class DarcBS extends BehaviorSubject<Darc> {
    public readonly inst: BehaviorSubject<IInstance>;

    constructor(darc: BehaviorSubject<Darc>) {
        super(darc.getValue());
        darc.subscribe(this);
    }

    public static async createDarcBS(bs: BasicStuff, darcID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<DarcBS> {
        if (darcID instanceof Buffer) {
            darcID = new BehaviorSubject(darcID);
        }
        const instObs = darcID.pipe(
            // TODO: would it work to remove flatMap with mergeAll?
            flatMap(id => bs.inst.instanceBS(id)),
            mergeAll(),
            map(inst => Darc.decode(inst.value)),
        );
        const bsDarc = await ObservableToBS(instObs);
        return new DarcBS(bsDarc)
    }

    public evolveDarc(tx: Transaction, updates: IDarcAttr, unrestricted = false): Darc {
        const newArgs = {...this.getValue().evolve(), ...updates};
        const newDarc = new Darc(newArgs);
        const cmd = unrestricted ? DarcInstance.commandEvolveUnrestricted : DarcInstance.commandEvolve;
        const args = [new Argument({
            name: DarcInstance.argumentDarc,
            value: Buffer.from(Darc.encode(newDarc).finish())
        })];
        tx.invoke(newDarc.getBaseID(), DarcInstance.contractID, cmd, args);
        return newDarc;
    }

    public setSignEvolve(tx: Transaction, idSign: IIdentity | InstanceID, idEvolve = idSign) {
        const rules = this.getValue().rules.clone();
        rules.setRule(Darc.ruleSign, toIId(idSign));
        if (idEvolve) {
            rules.setRule(DarcInstance.ruleEvolve, toIId(idEvolve));
        }
        this.evolveDarc(tx, {rules});
    }

    public addSignEvolve(tx: Transaction, idSign: IIdentity | InstanceID, idEvolve = idSign) {
        const rules = this.getValue().rules.clone();
        rules.appendToRule(Darc.ruleSign, toIId(idSign), Rule.OR);
        if (idEvolve) {
            rules.appendToRule(DarcInstance.ruleEvolve, toIId(idEvolve), Rule.OR);
        }
        this.evolveDarc(tx, {rules});
    }

    public rmSignEvolve(tx: Transaction, id: IIdentity | InstanceID) {
        const rules = this.getValue().rules.clone();
        rules.getRule(Darc.ruleSign).remove(toIId(id).toString());
        rules.getRule(DarcInstance.ruleEvolve).remove(toIId(id).toString());
        this.evolveDarc(tx, {rules});
    }
}

function toIId(id: IIdentity | InstanceID): IIdentity {
    if (id instanceof Buffer) {
        return new IdentityDarc({id: id});
    }
    return id;
}

export interface IDarcAttr {
    description?: Buffer;
    rules?: Rules;
}
