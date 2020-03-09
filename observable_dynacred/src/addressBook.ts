/**
 * ContactList wraps a list of credentialIDs in a set to be able to do add,
 * rm, has and convert it back to a long buffer again.
 * As the existing sets will store happily Buffer.from("1") and
 * Buffer.from("1") twice, this class converts all buffer to hex-codes, and
 * then back again.
 */
import {BehaviorSubject, Observable} from "rxjs";

import {InstanceID} from "@dedis/cothority/byzcoin";

import {
    AttributeInstanceSetBS,
    CredentialPublic,
    CredentialStructBS,
    EAttributesPublic,
    ECredentials
} from "./credentialStructBS";
import {CoinInstance} from "@dedis/cothority/byzcoin/contracts";
import {Darc, IdentityDarc, IIdentity} from "@dedis/cothority/darc";
import {Log} from "@dedis/cothority";
import {DarcBS, DarcsBS} from "./darcsBS";
import {BasicStuff} from "./user";
import {Transaction} from "./transaction";
import {CoinBS} from "./coinBS";
import {ConvertBS, ObservableHO, ObservableToBS} from "./observableHO";
import {flatMap, map, tap} from "rxjs/operators";
import {UserSkeleton} from "./userSkeleton";
import Long from "long";

export class AddressBook {

    constructor(public readonly contacts: ABContactsBS,
                public readonly groups: ABGroupsBS,
                public readonly actions: ABActionsBS
    ) {
    }

    public static async getAddressBook(bs: BasicStuff, cp: CredentialPublic): Promise<AddressBook> {
        const contactBS = await ABContactsBS.createABContactsBS(bs, cp.contacts);
        Log.lvl3("getting groups");
        const groupsBS = await ABGroupsBS.createABGroupBS(bs, cp.groups);
        Log.lvl3("getting actions");
        const actionsBS = await ABActionsBS.createABActionsBS(bs, cp.actions);
        return new AddressBook(contactBS, groupsBS, actionsBS);
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

    public static async createABContactsBS(bs: BasicStuff, aisBS: AttributeInstanceSetBS) {
        return new ABContactsBS(aisBS,
            await ObservableToBS(aisBS.pipe(
                flatMap(ais => Promise.all(ais.toInstanceIDs().map(
                    async (id) => CredentialStructBS.getCredentialStructBS(bs, id)
                )))))
        )
    }

    public getOHO(bs: BasicStuff): Observable<BehaviorSubject<CredentialStructBS>[]> {
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
        tx.setAttributes(d, {cred: ECredentials.pub, attr: EAttributesPublic.alias, value: Buffer.from(newName)});
    }
}

export class ABGroupsBS extends DarcsBS {
    constructor(
        private ais: AttributeInstanceSetBS,
        dbs: DarcsBS) {
        super(dbs)
    }

    public static async createABGroupBS(bs, aisBS: AttributeInstanceSetBS): Promise<ABGroupsBS> {
        return new ABGroupsBS(aisBS,
            await DarcsBS.getDarcsBS(bs, ConvertBS(aisBS, gr => gr.toInstanceIDs())));
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

    public static async createABActionsBS(bs: BasicStuff, aisBS: AttributeInstanceSetBS): Promise<ABActionsBS> {
        return new ABActionsBS(aisBS,
            await ObservableToBS(aisBS.pipe(
                flatMap(ais => Promise.all(ais.toInstanceIDs().map(
                    id => DarcBS.getDarcBS(bs, id)
                ))),
                map(dbs => dbs.map(db => new ActionBS(db)))
            )));
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
