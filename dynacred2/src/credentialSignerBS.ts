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
import {Darc, IIdentity} from "@dedis/cothority/darc";
import {InstanceID} from "@dedis/cothority/byzcoin";

import {CredentialInstanceMapBS} from "./credentialStructBS";
import {DarcBS, DarcsBS} from "./byzcoin/darcsBS";
import {CredentialTransaction} from "./credentialTransaction";

export class CredentialSignerBS extends DarcBS {
    constructor(darcBS: DarcBS,
                public readonly devices: CSTypesBS,
                public readonly recoveries: CSTypesBS) {
        super(darcBS);
    }
}

export class CSTypesBS extends DarcsBS {
    constructor(private signerDarcBS: DarcBS,
                public readonly cim: CredentialInstanceMapBS,
                public readonly prefix: string,
                dbs: DarcsBS) {
        super(dbs);
    }

    public create(tx: CredentialTransaction, name: string, identity: IIdentity[]): Darc {
        const newDarc = tx.spawnDarcBasic(`${this.prefix}:${name}`, identity);
        this.link(tx, name, newDarc.getBaseID());
        return newDarc;
    }

    public link(tx: CredentialTransaction, name: string, id: InstanceID) {
        this.signerDarcBS.addSignEvolve(tx, id);
        this.cim.setEntry(tx, name, id);
    }

    public unlink(tx: CredentialTransaction, id: InstanceID) {
        if (!this.cim.hasEntry(id)) {
            return;
        }
        this.cim.rmEntry(tx, id);
        this.signerDarcBS.rmSignEvolve(tx, id);
    }

    public rename(tx: CredentialTransaction, id: Buffer, newName: string) {
        if (!this.cim.hasEntry(id)) {
            throw new Error("this signer doesn't exist");
        }
        if ([...this.cim.getValue().map.values()].includes(newName)) {
            throw new Error("new name already exists");
        }
        // const dbs = this.getValue().find(d => d.getValue().getBaseID().equals(id));
        // dbs.evolve(tx, {description: Buffer.from(`${this.prefix}:${newName}`)});
        this.cim.setEntry(tx, newName, id);
    }

    public find(name: string): DarcBS | undefined {
        return this.getValue().find(dbs => dbs.getValue().description.toString().match(`/${name}/`));
    }
}
