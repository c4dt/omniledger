/**
 * ContactList wraps a list of credentialIDs in a set to be able to do add,
 * rm, has and convert it back to a long buffer again.
 * As the existing sets will store happily Buffer.from("1") and
 * Buffer.from("1") twice, this class converts all buffer to hex-codes, and
 * then back again.
 */
import {BehaviorSubject, Observable} from "rxjs";
import Long from "long";

import {InstanceID} from "@dedis/cothority/byzcoin";
import {CoinInstance} from "@dedis/cothority/byzcoin/contracts";
import {Darc, IdentityDarc, IIdentity} from "@dedis/cothority/darc";

import {AttributeInstanceSetBS, CredentialStructBS, EAttributesPublic, ECredentials} from "./credentialStructBS";
import {DarcBS, DarcsBS} from "./darcsBS";
import {Transaction} from "./transaction";
import {CoinBS} from "./coinBS";
import {ObservableHO} from "./observableHO";
import {UserSkeleton} from "./userSkeleton";

export class AddressBook {
    constructor(public readonly contacts: ABContactsBS,
                public readonly groups: ABGroupsBS,
                public readonly actions: ABActionsBS
    ) {
    }
}

export class ABContactsBS extends BehaviorSubject<CredentialStructBS[]> {
    constructor(
        private ais: AttributeInstanceSetBS,
        bscs: BehaviorSubject<CredentialStructBS[]>
    ) {
        super(bscs.getValue());
        bscs.subscribe(this);
    }

    public getOHO(): Observable<BehaviorSubject<CredentialStructBS>[]> {
        return ObservableHO({
            source: this,
            convert: src => Promise.resolve(new BehaviorSubject(src)),
            srcStringer: src => src.id.toString("hex"),
        });
    }

    public create(tx: Transaction, user: UserSkeleton, initial = Long.fromNumber(0)) {
        tx.createUser(user, initial);
        this.link(tx, user.credID);
    }

    public link(tx: Transaction, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().add(id));
    }

    public unlink(tx: Transaction, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().rm(id));
    }

    public rename(tx: Transaction, oldName: string, newName: string) {
        const d = this.getValue().find(d => d.credPublic.alias.getValue() === oldName);
        if (!d) {
            throw new Error("couldn't find group with that name");
        }
        d.updateCredential(tx, {cred: ECredentials.pub, attr: EAttributesPublic.alias, value: Buffer.from(newName)});
    }
}

export class ABGroupsBS extends DarcsBS {
    constructor(
        private ais: AttributeInstanceSetBS,
        dbs: DarcsBS) {
        super(dbs)
    }

    public find(name: string): DarcBS | undefined {
        return this.getValue().find(dbs => dbs.getValue().description.toString().match(`/\w${name}$/`))
    }

    public create(tx: Transaction, name: string, signers: IIdentity[]): Darc {
        const d = tx.spawnDarcBasic(name, signers);
        this.link(tx, d.getBaseID());
        return d;
    }

    public link(tx: Transaction, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().add(id));
    }

    public unlink(tx: Transaction, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().rm(id));
    }

    public rename(tx: Transaction, oldName: string, newName: string) {
        const d = this.getValue().find(d => d.getValue().description.equals(Buffer.from(oldName)));
        if (!d) {
            throw new Error("couldn't find group with that name");
        }
        d.evolveDarc(tx, {description: Buffer.from(newName)});
    }
}

export class ABActionsBS extends BehaviorSubject<ActionBS[]> {
    constructor(
        private ais: AttributeInstanceSetBS,
        abs: BehaviorSubject<ActionBS[]>
    ) {
        super(abs.getValue());
        abs.subscribe(this);
    }

    public create(tx: Transaction, desc: string, signers: IIdentity[]) {
        const signDarc = tx.spawnDarcBasic(desc, signers);
        const signDarcID = new IdentityDarc({id: signDarc.id});
        const coinDarc = Darc.createBasic([], [signDarcID], Buffer.from(`${name}:coin`),
            [`invoke:${CoinInstance.contractID}.${CoinInstance.commandTransfer}`]);
        tx.spawnDarc(coinDarc);
        const coinID = Buffer.from(`${name}:coin`);
        tx.spawnCoin(coinID, coinDarc.getBaseID());
        this.link(tx, signDarc.getBaseID());
    }

    public link(tx: Transaction, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().add(id));
    }

    public unlink(tx: Transaction, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().rm(id));
    }

    public rename(tx: Transaction, oldName: string, newName: string) {
        const action = this.getValue().find(a => a.darc.getValue().description.equals(Buffer.from(oldName)));
        if (!action) {
            throw new Error("couldn't find this action");
        }
        action.darc.evolveDarc(tx, {description: Buffer.from(newName)});
    }
}

/**
 * TODO: Need to link CoinBS somewhere in the Credential - currently it's not stored!
 */
export class ActionBS {
    constructor(
        public darc: DarcBS,
        public coin?: CoinBS) {
    }
}
