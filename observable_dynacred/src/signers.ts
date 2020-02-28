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
import {Darc, IdentityEd25519, IdentityWrapper, IIdentity} from "@dedis/cothority/darc";

import {CredentialInstanceMapBS, CredentialStructBS} from "./credentialStructBS";
import {ConvertBS, ObservableHO} from "./observableHO";
import {InstanceID} from "@dedis/cothority/byzcoin";
import {DarcBS, DarcsBS} from "./darcsBS";
import {BasicStuff} from "./user";
import {Transaction} from "./transaction";
import {BehaviorSubject, Observable} from "rxjs";
import {Point} from "@dedis/kyber/index";
import Log from "@dedis/cothority/log";

export class CredentialSignerBS extends DarcBS {
    constructor(darcBS: DarcBS,
                public readonly devices: CSTypesBS,
                public readonly recoveries: CSTypesBS) {
        super(darcBS);
    }

    public static async createCredentialSignerBS(bs: BasicStuff, credStructBS: CredentialStructBS): Promise<CredentialSignerBS> {
        Log.lvl3("searching signer darc", credStructBS.darcID);
        const credDarc = await DarcBS.createDarcBS(bs, credStructBS.darcID);
        Log.lvl3("searching signer darc");
        const signerDarcID = IdentityWrapper.fromString(credDarc.getValue().rules.getRule(Darc.ruleSign).getIdentities()[0]).darc.id;
        Log.lvl3("searching signer darc");
        const darcBS = await DarcBS.createDarcBS(bs, signerDarcID);
        Log.lvl3("loading devices");
        const devices = new CSTypesBS(darcBS, credStructBS.credDevices, "device",
            await DarcsBS.createDarcsBS(bs,
                ConvertBS(credStructBS.credDevices, im => im.toInstanceIDs())));
        Log.lvl3("loading recoveries");
        const recoveries = new CSTypesBS(darcBS, credStructBS.credRecoveries, "recovery",
            await DarcsBS.createDarcsBS(bs,
                ConvertBS(credStructBS.credRecoveries, im => im.toInstanceIDs())));
        return new CredentialSignerBS(darcBS, devices, recoveries);
    }
}

export class CSTypesBS extends DarcsBS {
    constructor(private signerDarcBS: DarcBS,
                private cim: CredentialInstanceMapBS,
                private prefix: string,
                dbs: DarcsBS) {
        super(dbs);
    }

    public getOHO(bs: BasicStuff): Observable<BehaviorSubject<DarcBS>[]> {
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

    async unlink(tx: Transaction, name: string) {
        const im = this.cim.getValue();
        if (!im.has(name)) {
            return;
        }
        const darcID = im.get(name);
        this.cim.rmValue(tx, name);
        if (darcID) {
            this.signerDarcBS.rmSignEvolve(tx, darcID);
        }
    }

    async rename(tx: Transaction, oldName: string, newName: string): Promise<void> {
        const im = this.cim.getValue();
        if (!im.has(oldName)) {
            throw new Error("this signer doesn't exist");
        }
        if (im.has(newName)) {
            throw new Error("new name already exists");
        }
        const darcID = im.get(oldName);
        this.cim.rmValue(tx, oldName);
        if (darcID) {
            const dbs = this.getValue().find(d => d.getValue().getBaseID().equals(darcID));
            dbs.evolveDarc(tx, {description: Buffer.from(`${this.prefix}:${newName}`)});
            this.signerDarcBS.rmSignEvolve(tx, darcID);
            this.signerDarcBS.addSignEvolve(tx, darcID);
        }
    }
}
