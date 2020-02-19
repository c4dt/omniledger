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

import {
    Darc,
    IdentityWrapper,
    Rule,
    SignerEd25519
} from "@dedis/cothority/darc";

import {DoThings} from "./user";
import {CredentialBS, CredentialStructBS} from "./credentialStructBS";
import {map} from "rxjs/operators";
import {ObservableHO, ObservableToBS} from "./observableHO";
import {InstanceID} from "@dedis/cothority/byzcoin";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";
import {DarcInstance} from "@dedis/cothority/byzcoin/contracts";

export class CredentialSignerBS extends BehaviorSubject<Darc> {
    constructor(private dt: DoThings, private credStructBS: CredentialStructBS,
                d: BehaviorSubject<Darc>,
                private signerDarcs: BehaviorSubject<InstanceID[]>) {
        super(d.getValue());
        d.subscribe(this);
    }

    // TODO: not really sure this is what we want - shouldn't it be a HOB?
    public static async fromScratch(dt: DoThings, credStructBS: CredentialStructBS): Promise<CredentialSignerBS> {
        const credDarc = Darc.decode(
            (await dt.inst.instanceObservable(credStructBS.darcID))
                .getValue().value);
        const signerDarcID = IdentityWrapper.fromString(
            credDarc.rules.getRule(Darc.ruleSign).getIdentities()[0]).darc.id;
        const darcInst = (await dt.inst.instanceObservable(signerDarcID))
            .pipe(map(inst => Darc.decode(inst.value)));

        const signerDarcIDs = await ObservableToBS(darcInst.pipe(
            map((d) => d.rules.getRule(Darc.ruleSign).getIdentities()
                .map(id => IdentityWrapper.fromString(id).darc.id))
        ));

        return new CredentialSignerBS(dt, credStructBS,
            await ObservableToBS(darcInst), signerDarcIDs);
    }

    getDarcsOHO(creds: CredentialBS): Observable<Signer[]> {
        return ObservableHO({
            source: this.signerDarcs.pipe(
                map((darcIDs) => darcIDs.filter((darcID) =>
                    creds.getValue().attributes
                        .find((att) => att.value.equals(darcID))
                ))
            ),
            convert: async (src) => Signer.fromDarcID(this.dt, src),
            srcStringer: (src) => src.toString("hex"),
            stringToSrc: (str) => Buffer.from(str, "hex"),
        });
    }

    getDevicesOHO(): Observable<Signer[]> {
        return this.getDarcsOHO(this.credStructBS.credDevices);
    }

    getRecoveriesOHO(): Observable<Signer[]> {
        return this.getDarcsOHO(this.credStructBS.credRecoveries);
    }

    async addSigner(name: string, signer: SignerEd25519): Promise<Darc> {
        const newDarc = Darc.createBasic([signer], [signer], Buffer.from(name));
        const coin = await this.dt.coin.coinInstanceBS();
        await this.dt.spawner.spawnDarcs(coin.getValue(), [this.dt.kiSigner], newDarc);

        const darcIdentity = new IdentityDarc({id: newDarc.getBaseID()});
        const newSDInst = DarcInstance.create(this.dt.bc as any, this.getValue());
        const newSD = this.getValue().evolve();
        newSD.rules.appendToRule(Darc.ruleSign, darcIdentity, Rule.OR);
        newSD.rules.appendToRule(DarcInstance.ruleEvolve, darcIdentity, Rule.OR);
        await newSDInst.evolveDarcAndWait(newSD, [this.dt.kiSigner], 5);
        return newDarc;
    }

    async rmSigner(darcID: InstanceID): Promise<void> {
        const newSDInst = DarcInstance.create(this.dt.bc as any, this.getValue());
        const newSD = this.getValue().evolve();
        const idStr = new IdentityDarc({id: darcID}).toString();
        try {
            newSD.rules.getRule(Darc.ruleSign).remove(idStr);
            newSD.rules.getRule(DarcInstance.ruleEvolve).remove(idStr);
            await newSDInst.evolveDarcAndWait(newSD, [this.dt.kiSigner], 5);
        } catch (e) {
            if (!e.toString().match("this identity is not part of the rule")) {
                throw e;
            }
        }
    }

    async addDevice(name: string, signer: SignerEd25519): Promise<Darc> {
        const dn = `device:${name}`;
        const newDarc = await this.addSigner(dn, signer);
        await this.credStructBS.credDevices.setValue(dn, newDarc.getBaseID());
        return newDarc;
    }

    async rmDevice(name: string): Promise<void> {
        const attr = this.credStructBS.credDevices.getAttributeBS(name);
        if (!attr) {
            throw new Error("this device does not exist");
        }
        const darcID = attr.getValue();
        if (!darcID) {
            await this.credStructBS.credDevices.rmValue(name);
            throw new Error("no darcID for this device");
        }
        await this.rmSigner(darcID);
        return this.credStructBS.credDevices.rmValue(name);
    }

    async addRecovery(name: string, signer: SignerEd25519): Promise<Darc> {
        const rn = `recovery:${name}`;
        const newDarc = await this.addSigner(rn, signer);
        await this.credStructBS.credRecoveries.setValue(rn, newDarc.getBaseID());
        return newDarc;
    }
}

export class Signer extends BehaviorSubject<Darc> {
    constructor(bs: BehaviorSubject<Darc>) {
        super(bs.getValue());
        bs.subscribe(this);
    }

    public static async fromDarcID(dt: DoThings, darcID: InstanceID): Promise<Signer> {
        return new Signer(
            await ObservableToBS((await dt.inst.instanceObservable(darcID))
                .pipe(map(inst => Darc.decode(inst.value)))));
    }

    getName(): string {
        return this.getValue().description.toString();
    }
}
