import { BehaviorSubject } from "rxjs";

import { Argument, InstanceID, Proof } from "@dedis/cothority/byzcoin";
import { DarcInstance } from "@dedis/cothority/byzcoin/contracts";
import { Darc, IIdentity, Rule, Rules } from "@dedis/cothority/darc";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";

import { TransactionBuilder } from "./transactionBuilder";

export class DarcsBS extends BehaviorSubject<DarcBS[]> {
    constructor(sbs: BehaviorSubject<DarcBS[]>) {
        super(sbs.getValue());
        sbs.subscribe(this);
    }
}

export class DarcBS extends BehaviorSubject<Darc> {
    readonly inst: BehaviorSubject<Proof>;

    constructor(darc: BehaviorSubject<Darc>) {
        super(darc.getValue());
        darc.subscribe(this);
    }

    evolve(tx: TransactionBuilder, updates: IDarcAttr, unrestricted = false): Darc {
        const newArgs = {...this.getValue().evolve(), ...updates};
        const newDarc = new Darc(newArgs);
        const cmd = unrestricted ? DarcInstance.commandEvolveUnrestricted : DarcInstance.commandEvolve;
        const args = [new Argument({
            name: DarcInstance.argumentDarc,
            value: Buffer.from(Darc.encode(newDarc).finish()),
        })];
        tx.invoke(newDarc.getBaseID(), DarcInstance.contractID, cmd, args);
        return newDarc;
    }

    setSignEvolve(tx: TransactionBuilder, idSign: IIdentity | InstanceID, idEvolve = idSign) {
        const rules = this.getValue().rules.clone();
        rules.setRule(Darc.ruleSign, toIId(idSign));
        if (idEvolve) {
            rules.setRule(DarcInstance.ruleEvolve, toIId(idEvolve));
        }
        this.evolve(tx, {rules});
    }

    addSignEvolve(tx: TransactionBuilder, idSign: IIdentity | InstanceID, idEvolve = idSign) {
        const rules = this.getValue().rules.clone();
        rules.appendToRule(Darc.ruleSign, toIId(idSign), Rule.OR);
        if (idEvolve) {
            rules.appendToRule(DarcInstance.ruleEvolve, toIId(idEvolve), Rule.OR);
        }
        this.evolve(tx, {rules});
    }

    rmSignEvolve(tx: TransactionBuilder, id: IIdentity | InstanceID) {
        const rules = this.getValue().rules.clone();
        rules.getRule(Darc.ruleSign).remove(toIId(id).toString());
        rules.getRule(DarcInstance.ruleEvolve).remove(toIId(id).toString());
        this.evolve(tx, {rules});
    }
}

function toIId(id: IIdentity | InstanceID): IIdentity {
    if (id instanceof Buffer) {
        return new IdentityDarc({id});
    }
    return id;
}

export interface IDarcAttr {
    description?: Buffer;
    rules?: Rules;
}
