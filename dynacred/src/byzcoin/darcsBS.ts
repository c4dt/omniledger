import { BehaviorSubject, of } from "rxjs";
import { catchError, flatMap, map, mergeAll } from "rxjs/operators";

import { Argument, ByzCoinRPC, InstanceID, Proof } from "@dedis/cothority/byzcoin";
import { DarcInstance } from "@dedis/cothority/byzcoin/contracts";
import { Darc, IIdentity, Rule, Rules } from "@dedis/cothority/darc";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";
import Log from "@dedis/cothority/log";

import { ObservableToBS } from "../observableUtils";
import { TransactionBuilder } from "./transactionBuilder";

/**
 * A DarcBS class represents a darc on byzcoin. It has methods to modify the darc by
 * adding and removing rules, as well as to change the description.
 */
export class DarcBS extends BehaviorSubject<Darc> {

    /**
     * Retrieves a DarcBS from ByzCoin given an InstanceID.
     *
     * @param bc of an initialized ByzCoinRPC instance
     * @param darcID either a fixed InstanceID, or a changeable BehaviourSubject<InstanceID>
     * @return a DarcBS or undefined if something went wrong (no Darc at that ID)
     */
    static async retrieve(bc: ByzCoinRPC, darcID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<DarcBS | undefined> {
        Log.lvl3("getting darcBS");
        // Need to verify against Buffer here, which is the defined type of InstanceID.
        // Else typescript complains....
        if (Buffer.isBuffer(darcID)) {
            darcID = new BehaviorSubject(darcID);
        }
        const instObs = darcID.pipe(
            flatMap((id) => bc.instanceObservable(id)),
            mergeAll(),
            catchError((err) => {
                Log.error("caught error:", err);
                return of(undefined as Proof);
            }),
            map((inst) => (inst && inst.value && inst.value.length > 0) ?
                Darc.decode(inst.value) : undefined),
        );
        const bsDarc = await ObservableToBS(instObs);
        if (bsDarc.getValue() === undefined) {
            return undefined;
        }
        return new DarcBS(bsDarc);
    }

    readonly inst: BehaviorSubject<Proof>;

    constructor(darc: BehaviorSubject<Darc>) {
        super(darc.getValue());
        darc.subscribe(this);
    }

    /**
     * Creates an instruction in the transaction with either an update of the description and/or an update
     * of the rules.
     *
     * @param tx where the instruction will be appended to
     * @param updates contains a description update and/or rules to be merged
     * @param unrestricted if true, will create an unrestricted evolve that allows to create new rules
     * @return the new DARC as it will appear on ByzCoin if the transaction is accepted
     */
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

    /**
     * Sets the description of the DARC.
     *
     * @param tx where the instruction will be appended to
     * @param description of the new DARC
     * @return the new DARC as it will appear on ByzCoin if the transaction is accepted
     */
    setDescription(tx: TransactionBuilder, description: Buffer): Darc {
        return this.evolve(tx, {description});
    }

    /**
     * Sets the sign and evolve rules of the darc.
     *
     * @param tx where the instruction will be appended to
     * @param idSign the IIdentity or the InstanceID of the DARC that is delegated
     * @param idEvolve per default the same as idSign, but can be given as a different argument
     * @return the new DARC as it will appear on ByzCoin if the transaction is accepted
     */
    setSignEvolve(tx: TransactionBuilder, idSign: IIdentity | InstanceID, idEvolve = idSign): Darc {
        const rules = this.getValue().rules.clone();
        rules.setRule(Darc.ruleSign, toIId(idSign));
        if (idEvolve) {
            rules.setRule(DarcInstance.ruleEvolve, toIId(idEvolve));
        }
        return this.evolve(tx, {rules});
    }

    /**
     * Adds a sign and evolve element to the DARC with an OR expression
     *
     * @param tx where the instruction will be appended to
     * @param idSign IIdentity or DARC-ID to be added to the signature rule. If it is undefined, nothing will be
     * added to the signature rule
     * @param idEvolve IIdentity or DARC-ID to be added to the evolve rule. Per default the same as the idSign.
     * @return the new DARC as it will appear on ByzCoin if the transaction is accepted
     */
    addSignEvolve(tx: TransactionBuilder, idSign: IIdentity | InstanceID | undefined, idEvolve = idSign): Darc {
        const rules = this.getValue().rules.clone();
        if (idSign) {
            rules.appendToRule(Darc.ruleSign, toIId(idSign), Rule.OR);
        }
        if (idEvolve) {
            rules.appendToRule(DarcInstance.ruleEvolve, toIId(idEvolve), Rule.OR);
        }
        return this.evolve(tx, {rules});
    }

    /**
     * Removes an identity in the sign and/or evolve expression. The expressions need to be pure
     * OR expressions, else this will fail.
     *
     * @param tx where the instruction will be appended to
     * @param id IIdentity or DARC-ID to be removed from the evolve and sign rules. If it is only present in one of
     * the rules, it will log a warning, but continue.
     * @return the new DARC as it will appear on ByzCoin if the transaction is accepted
     */
    rmSignEvolve(tx: TransactionBuilder, id: IIdentity | InstanceID): Darc {
        const rules = this.getValue().rules.clone();
        try {
            rules.getRule(Darc.ruleSign).remove(toIId(id).toString());
        } catch (e) {
            Log.warn("while removing identity from _sign:", e);
        }
        try {
            rules.getRule(DarcInstance.ruleEvolve).remove(toIId(id).toString());
        } catch (e) {
            Log.warn("while removing identity from evolve:", e);
        }
        return this.evolve(tx, {rules});
    }
}

function toIId(id: IIdentity | InstanceID): IIdentity {
    if (Buffer.isBuffer(id)) {
        return new IdentityDarc({id});
    }
    return id;
}

export interface IDarcAttr {
    description?: Buffer;
    rules?: Rules;
}

/**
 * Holds a list of DARCs that will be updated individually, and whenever the list changes.
 */
export class DarcsBS extends BehaviorSubject<DarcBS[]> {

    /**
     * Retrieves an eventually changing list of darcs from ByzCoin.
     *
     * @param bc
     * @param aisbs
     */
    static async retrieve(bc: ByzCoinRPC, aisbs: BehaviorSubject<InstanceID[]>): Promise<DarcsBS> {
        Log.lvl3("getting darcsBS");
        const darcs = await ObservableToBS(aisbs.pipe(
            flatMap((ais) => Promise.all(ais
                .map((iid) => DarcBS.retrieve(bc, iid)))),
            map((dbs) => dbs.filter((db) => db !== undefined)),
        ));
        return new DarcsBS(darcs);
    }

    constructor(sbs: BehaviorSubject<DarcBS[]>) {
        super(sbs.getValue());
        sbs.subscribe(this);
    }
}
