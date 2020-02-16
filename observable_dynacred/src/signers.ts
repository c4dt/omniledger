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
import {CredentialBS, CredentialStructBS} from "src/credentialStructBS";
import {map} from "rxjs/operators";
import {ObservableHO, ObservableToBS} from "src/observableHO";
import {InstanceID} from "@dedis/cothority/byzcoin";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";
import {DarcInstance} from "@dedis/cothority/byzcoin/contracts";
import {Log} from "@dedis/cothority";

export class CredentialSignerBS extends BehaviorSubject<Darc> {

    constructor(private dt: DoThings, private credStructBS: CredentialStructBS,
                d: BehaviorSubject<Darc>,
                private signerDarcs: BehaviorSubject<InstanceID[]>) {
        super(d.getValue());
        d.subscribe(this);
    }

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

    getDevicesOHO(): Observable<Signer[]>{
        return this.getDarcsOHO(this.credStructBS.credDevices);
    }

    getRecoveriesOHO(): Observable<Signer[]>{
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

    async addDevice(name: string, signer: SignerEd25519): Promise<void> {
        const newDarc = await this.addSigner(`device:${name}`, signer);
        await this.credStructBS.credDevices.setValue("device", newDarc.getBaseID());
    }

    async addRecovery(name: string, signer: SignerEd25519): Promise<void> {
        const newDarc = await this.addSigner(`recovery:${name}`, signer);
        await this.credStructBS.credRecoveries.setValue("recovery", newDarc.getBaseID());
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
