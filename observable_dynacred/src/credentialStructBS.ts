import {BehaviorSubject} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";
import {
    Credential,
    CredentialsInstance,
    CredentialStruct
} from "@dedis/cothority/byzcoin/contracts";
import {
    Argument,
    ClientTransaction,
    InstanceID,
    Instruction
} from "@dedis/cothority/byzcoin";
import {curve} from "@dedis/kyber";
import {DoThings} from "./user";
import {filter} from "rxjs/internal/operators/filter";
import {Log} from "@dedis/cothority";
import {tap} from "rxjs/internal/operators/tap";
import {IInstance} from "src/instances";
import {ObservableToBS} from "src/observableHO";

export const ed25519 = new curve.edwards25519.Curve();

export enum ECredentials {
    pub = "1-public",
    config = "1-config",
    devices = "1-devices",
    recoveries = "1-recovery"
}

export interface IUpdateCredential{
    cred: string;
    attr: string;
    value: string | Buffer;
}

/**
 * Credential holds static methods that allow to setup instances for credentials.
 */
export class CredentialStructBS extends BehaviorSubject<CredentialStruct> {
    public static readonly structVersionLatest = 2;
    public static readonly urlRegistered = "https://pop.dedis.ch/qrcode/identity-2";
    public static readonly urlUnregistered = "https://pop.dedis.ch/qrcode/unregistered-2";

    public credPublic: CredentialPublic;
    public credConfig: CredentialConfig;
    public credDevices: CredentialBS;
    public credRecoveries: CredentialBS;

    constructor(private dt: DoThings,
                public readonly id: InstanceID,
                public readonly darcID: InstanceID,
                credBS: BehaviorSubject<CredentialStruct>) {
        super(credBS.getValue());
        credBS.subscribe(this);

        this.credPublic = new CredentialPublic(dt, this.credentialBS(ECredentials.pub));
        this.credConfig = new CredentialConfig(dt, this.credentialBS(ECredentials.config));
        this.credDevices = this.credentialBS(ECredentials.devices);
        this.credRecoveries = this.credentialBS(ECredentials.recoveries);
    }

    public static async fromScratch(dt: DoThings, id: InstanceID): Promise<CredentialStructBS> {
        const instBS = await ObservableToBS(await dt.inst.instanceObservable(id));
        const credBS = await ObservableToBS(instBS.pipe(
            map((ii) => CredentialStruct.decode(ii.value))
        ));
        return new CredentialStructBS(dt, id, instBS.getValue().darcID, credBS);
    }

    public credentialBS(name: ECredentials): CredentialBS {
        return CredentialBS.fromScratch(this.dt, this, name);
    }

    // updateCredentials sets all new credentials given in 'cred' and then
    // sends a ClientTransaction to Byzcoin.
    // If a value of a Credential is empty, it will be deleted.
    public async updateCredentials(...cred: IUpdateCredential[]): Promise<void> {
        const orig = this.getValue();
        for (const c of cred) {
            let value = c.value instanceof Buffer ? c.value : Buffer.from(c.value);
            if (value.length > 0) {
                orig.setAttribute(c.cred, c.attr, value);
            } else {
                orig.deleteAttribute(c.cred, c.attr);
            }
        }
        const ctx = ClientTransaction.make(3,
            Instruction.createInvoke(this.id, CredentialsInstance.contractID,
                CredentialsInstance.commandUpdate, [
                    new Argument({
                        name: CredentialsInstance.argumentCredential,
                        value: orig.toBytes()
                    })
                ]
            )
        );
        await ctx.updateCountersAndSign(this.dt.bc, [[this.dt.kiSigner]]);
        await this.dt.bc.sendTransactionAndWait(ctx);
    }
}

export class CredentialBS extends BehaviorSubject<Credential> {
    constructor(private dt: DoThings, private csbs: CredentialStructBS,
                private cred: string, creds: Credential) {
        super(creds);
    }

    public static fromScratch(dt: DoThings, csbs: CredentialStructBS, name: string): CredentialBS {
        const cred = csbs.getValue().getCredential(name) || new Credential();
        const cbs = new CredentialBS(dt, csbs, name, cred);
        csbs.pipe(map((c) => c.getCredential(name) || new Credential()))
            .subscribe((cred) => {
                cbs.next(cred);
            });
        return cbs;
    }

    public static getAttribute(cred: Credential, name: string): Buffer | undefined {
        const attr = cred.attributes.find((a) => a.name.toString() === name);
        if (attr === undefined) {
            return undefined;
        }
        return attr.value;
    }

    public getAttributeBS(name: string): BehaviorSubject<Buffer | undefined> {
        const bs = new BehaviorSubject<Buffer | undefined>(CredentialBS.getAttribute(this.getValue(), name));
        this.pipe(
            map((cred) => CredentialBS.getAttribute(cred, name)),
            filter((cred) => cred !== undefined),
            distinctUntilChanged((a, b) => a.equals(b))
        ).subscribe(bs);
        return bs;
    }

    public async setValue(attr: string, value: string | Buffer): Promise<void>{
        return this.csbs.updateCredentials({cred: this.cred, attr, value})
    }

    public async rmValue(attr: string): Promise<void>{
        return this.setValue(attr, Buffer.alloc(0));
    }
}

export class CredentialAttributeBS<T extends string | Buffer> extends BehaviorSubject<T> {
    constructor(private dt: DoThings, private cbs: CredentialBS,
                private name: string, private attr: T) {
        super(attr);
    }

    public static fromScratchString(dt: DoThings, cbs: CredentialBS,
                                    name: string): CredentialAttributeBS<string> {
        const bs = cbs.getAttributeBS(name);
        const attr = (bs.getValue()||Buffer.alloc(0)).toString();
        const cabs = new CredentialAttributeBS(dt, cbs, name, attr);
        bs.pipe(map((buf) => (buf||Buffer.alloc(0)).toString())).subscribe(cabs);
        return cabs;
    }

    public static fromScratchBuffer(dt: DoThings, cbs: CredentialBS,
                                    name: string): CredentialAttributeBS<InstanceID> {
        const bs = cbs.getAttributeBS(name);
        const cabs = new CredentialAttributeBS(dt, cbs, name, bs.getValue());
        bs.subscribe(cabs);
        return cabs;
    }

    public async setValue(val: T): Promise<void> {
        return this.cbs.setValue(this.name, val);
    }
}

export enum EAttributesPublic {
    contacts = "contacts",
    alias = "alias",
    email = "email",
    coinID = "coin",
    seedPub = "seedPub",
    phone = "phone"
}

export class CredentialPublic {
    public contacts: CredentialAttributeBS<InstanceID>;
    public alias: CredentialAttributeBS<string>;
    public email: CredentialAttributeBS<string>;
    public coinID: CredentialAttributeBS<InstanceID>;
    public seedPub: CredentialAttributeBS<Buffer>;
    public phone: CredentialAttributeBS<string>;

    constructor(private dt: DoThings, cbs: CredentialBS) {
        this.contacts = CredentialAttributeBS.fromScratchBuffer(dt, cbs, EAttributesPublic.contacts);
        this.alias = CredentialAttributeBS.fromScratchString(dt, cbs, EAttributesPublic.alias);
        this.email = CredentialAttributeBS.fromScratchString(dt, cbs, EAttributesPublic.email);
        this.coinID = CredentialAttributeBS.fromScratchBuffer(dt, cbs, EAttributesPublic.coinID);
        this.seedPub = CredentialAttributeBS.fromScratchBuffer(dt, cbs, EAttributesPublic.seedPub);
        this.phone = CredentialAttributeBS.fromScratchString(dt, cbs, EAttributesPublic.phone);
    }
}

export enum EAttributesConfig {
    view = "view",
    spawner = "spawner"
}

export class CredentialConfig {
    public view: CredentialAttributeBS<string>;
    public spawner: CredentialAttributeBS<InstanceID>;
    constructor(private dt: DoThings, cbs: CredentialBS) {
        this.view = CredentialAttributeBS.fromScratchString(dt, cbs, EAttributesConfig.view);
        this.spawner = CredentialAttributeBS.fromScratchBuffer(dt, cbs, EAttributesConfig.spawner);
    }
}
