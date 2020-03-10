/**
 * Signers holds three classes that represent how trust is delegated in
 * dynacred:
 * - Signer - is the generic signer class representing a darc but wrapping
 * it with useful methods
 * - CredentialSigner - is referenced to by all the elements of DynaCred as
 * the allowed signer
 * - Device - extends signer to represent a device with one key
 * - Recover - extends a signer to represent a signer allowed to recover
 */
import {BehaviorSubject, Observable} from "rxjs";

import {Darc, IIdentity} from "@dedis/cothority/darc";
import {InstanceID} from "@dedis/cothority/byzcoin";

import {CredentialInstanceMapBS} from "./credentialStructBS";
import {ObservableHO} from "./observableHO";
import {DarcBS, DarcsBS} from "./darcsBS";
import {Transaction} from "./transaction";

export class CredentialSignerBS extends DarcBS {
    constructor(darcBS: DarcBS,
                public readonly devices: CSTypesBS,
                public readonly recoveries: CSTypesBS) {
        super(darcBS);
    }
}

export class CSTypesBS extends DarcsBS {
    constructor(private signerDarcBS: DarcBS,
                private cim: CredentialInstanceMapBS,
                public readonly prefix: string,
                dbs: DarcsBS) {
        super(dbs);
    }

    public getOHO(): Observable<BehaviorSubject<DarcBS>[]> {
        return ObservableHO({
            source: this,
            convert: src => Promise.resolve(new BehaviorSubject(src)),
            srcStringer: src => src.getValue().getBaseID().toString("hex"),
        })
    }

    public create(tx: Transaction, name: string, identity: IIdentity[]): Darc {
        const newDarc = tx.spawnDarcBasic(`${this.prefix}:${name}`, identity);
        this.link(tx, name, newDarc.getBaseID());
        return newDarc;
    }

    public link(tx: Transaction, name: string, id: InstanceID) {
        this.signerDarcBS.addSignEvolve(tx, id);
        this.cim.setValue(tx, name, id);
    }

    public unlink(tx: Transaction, name: string) {
        const im = this.cim.getValue();
        if (!im.map.has(name)) {
            return;
        }
        const darcID = im.map.get(name);
        this.cim.rmValue(tx, name);
        if (darcID) {
            this.signerDarcBS.rmSignEvolve(tx, darcID);
        }
    }

    public rename(tx: Transaction, oldName: string, newName: string) {
        const im = this.cim.getValue();
        if (!im.map.has(oldName)) {
            throw new Error("this signer doesn't exist");
        }
        if (im.map.has(newName)) {
            throw new Error("new name already exists");
        }
        const darcID = im.map.get(oldName);
        this.cim.rmValue(tx, oldName);
        if (darcID) {
            const dbs = this.getValue().find(d => d.getValue().getBaseID().equals(darcID));
            dbs.evolveDarc(tx, {description: Buffer.from(`${this.prefix}:${newName}`)});
            this.signerDarcBS.rmSignEvolve(tx, darcID);
            this.signerDarcBS.addSignEvolve(tx, darcID);
        }
    }

    public find(name: string): DarcBS | undefined {
        return this.getValue().find(dbs => dbs.getValue().description.toString().match(`/${name}/`));
    }
}
