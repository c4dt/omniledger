/**
 * AddressBook holds the contacts, groups and actions of a user.
 */
import Long from "long";
import { BehaviorSubject } from "rxjs";

import { InstanceID } from "@dedis/cothority/byzcoin";
import { CoinInstance } from "@dedis/cothority/byzcoin/contracts";
import { Darc, IdentityDarc, IIdentity } from "@dedis/cothority/darc";

import { CoinBS, DarcBS, DarcsBS } from "./byzcoin";
import { AttributeInstanceSetBS, CredentialStructBS, EAttributesPublic, ECredentials } from "./credentialStructBS";
import { SpawnerTransactionBuilder } from "./spawnerTransactionBuilder";
import { UserSkeleton } from "./userSkeleton";

/**
 * The `AddressBook` represents the following DARCs of the `CredentialStruct`:
 * - `credPublic.contacts` as `ABContactsBS` - links to other credentials the user knows
 * - `credPublic.groups` as `ABGroupsBS` - groups the user follows
 * - `credPublic.actions` as `ABActionsBS` - actions, which are DARCs + a coin-instance for actions like login
 *
 * Every field is set up as a `BehaviorSubject`, which means that there is a `getValue()` method to get the current
 * value, but also a `.subscribe()` to be informed if anything changes.
 * If an element is removed or added, the `BehaviorSubject` calls `next` method on all observers.
 * If an element is changed, only the `BehaviorSubject` of this element is updated.
 */
export class AddressBook {
    constructor(readonly contacts: ABContactsBS,
                readonly groups: ABGroupsBS,
                readonly actions: ABActionsBS,
    ) {
    }
}

export class ABContactsBS extends BehaviorSubject<CredentialStructBS[]> {
    constructor(
        private ais: AttributeInstanceSetBS,
        bscs: BehaviorSubject<CredentialStructBS[]>,
    ) {
        super(bscs.getValue());
        bscs.subscribe(this);
    }

    create(tx: SpawnerTransactionBuilder, user: UserSkeleton, initial = Long.fromNumber(0)) {
        tx.createUser(user, initial);
        this.link(tx, user.credID);
    }

    link(tx: SpawnerTransactionBuilder, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().add(id));
    }

    unlink(tx: SpawnerTransactionBuilder, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().rm(id));
    }

    rename(tx: SpawnerTransactionBuilder, oldName: string, newName: string) {
        const group = this.getValue().find((d) => d.credPublic.alias.getValue() === oldName);
        if (!group) {
            throw new Error("couldn't find group with that name");
        }
        group.updateCredential(tx, {
            attr: EAttributesPublic.alias,
            cred: ECredentials.pub,
            value: Buffer.from(newName),
        });
    }
}

export class ABGroupsBS extends DarcsBS {
    constructor(
        private ais: AttributeInstanceSetBS,
        dbs: DarcsBS) {
        super(dbs);
    }

    find(name: string): DarcBS | undefined {
        return this.getValue().find((dbs) => dbs.getValue().description.toString().match(`\\b${name}$`));
    }

    create(tx: SpawnerTransactionBuilder, name: string, signers: IIdentity[]): Darc {
        const d = tx.spawnDarcBasic(name, signers);
        this.link(tx, d.getBaseID());
        return d;
    }

    link(tx: SpawnerTransactionBuilder, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().add(id));
    }

    unlink(tx: SpawnerTransactionBuilder, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().rm(id));
    }

    rename(tx: SpawnerTransactionBuilder, oldName: string, newName: string) {
        const group = this.getValue().find((d) => d.getValue().description.equals(Buffer.from(oldName)));
        if (!group) {
            throw new Error("couldn't find group with that name");
        }
        group.evolve(tx, {description: Buffer.from(newName)});
    }
}

export class ABActionsBS extends BehaviorSubject<ActionBS[]> {
    constructor(
        private ais: AttributeInstanceSetBS,
        abs: BehaviorSubject<ActionBS[]>,
    ) {
        super(abs.getValue());
        abs.subscribe(this);
    }

    create(tx: SpawnerTransactionBuilder, desc: string, signers: IIdentity[]) {
        const signDarc = tx.spawnDarcBasic(desc, signers);
        const signDarcID = new IdentityDarc({id: signDarc.id});
        const coinDarc = Darc.createBasic([], [signDarcID], Buffer.from(`${name}:coin`),
            [`invoke:${CoinInstance.contractID}.${CoinInstance.commandTransfer}`]);
        tx.spawnDarc(coinDarc);
        const coinID = Buffer.from(`${name}:coin`);
        tx.spawnCoin(coinID, coinDarc.getBaseID());
        this.link(tx, signDarc.getBaseID());
    }

    link(tx: SpawnerTransactionBuilder, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().add(id));
    }

    unlink(tx: SpawnerTransactionBuilder, id: InstanceID) {
        this.ais.setInstanceSet(tx, this.ais.getValue().rm(id));
    }

    rename(tx: SpawnerTransactionBuilder, oldName: string, newName: string) {
        const action = this.getValue().find((a) => a.darc.getValue().description.equals(Buffer.from(oldName)));
        if (!action) {
            throw new Error("couldn't find this action");
        }
        action.darc.evolve(tx, {description: Buffer.from(newName)});
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
