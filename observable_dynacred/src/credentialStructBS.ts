import {BehaviorSubject} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";
import {Attribute, Credential, CredentialsInstance, CredentialStruct} from "@dedis/cothority/byzcoin/contracts";
import {Argument, InstanceID} from "@dedis/cothority/byzcoin";
import {curve, Point, PointFactory} from "@dedis/kyber";
import {filter} from "rxjs/internal/operators/filter";
import {ConvertBS} from "./observableHO";
import {Log} from "@dedis/cothority";
import {Transaction} from "./transaction";
import {BasicStuff} from "./user";
import Long from "long";

export const ed25519 = new curve.edwards25519.Curve();

export enum ECredentials {
    pub = "1-public",
    config = "1-config",
    devices = "1-devices",
    recoveries = "1-recovery"
}

export interface IUpdateCredential {
    cred: ECredentials;
    attr: EAttributesPublic | EAttributesConfig | string;
    value: string | Buffer | undefined;
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
    public credDevices: CredentialInstanceMapBS;
    public credRecoveries: CredentialInstanceMapBS;

    constructor(private bs: BasicStuff,
                public readonly id: InstanceID,
                public readonly darcID: InstanceID,
                credBS: BehaviorSubject<CredentialStruct>) {
        super(credBS.getValue());
        credBS.subscribe(this);

        this.credPublic = new CredentialPublic(this.getCredentialBS(ECredentials.pub));
        this.credConfig = new CredentialConfig(this.getCredentialBS(ECredentials.config));
        this.credDevices = this.getCredentialInstanceMapBS(ECredentials.devices);
        this.credRecoveries = this.getCredentialInstanceMapBS(ECredentials.recoveries);
    }

    public static async createCredentialStructBS(bs: BasicStuff, id: InstanceID): Promise<CredentialStructBS> {
        Log.lvl3("creating CredentialStruct from scratch:", id);
        const instBS = await bs.inst.instanceBS(id);
        const darcID = instBS.getValue().darcID;
        const credBS = ConvertBS(instBS, inst => CredentialStruct.decode(inst.value));
        return new CredentialStructBS(bs, id, darcID, credBS);
    }

    public getCredentialBS(name: ECredentials): CredentialBS {
        return CredentialBS.fromScratch(this.bs, this, name);
    }

    // updateCredentials sets all new credentials given in 'cred' and then
    // sends a ClientTransaction to Byzcoin.
    // If a value of a Credential is empty, it will be deleted.
    public updateCredential(tx: Transaction, ...cred: IUpdateCredential[]) {
        const orig = this.getValue();
        for (const c of cred) {
            if (c.value !== undefined) {
                let value = c.value instanceof Buffer ? c.value : Buffer.from(c.value);
                orig.setAttribute(c.cred, c.attr, value);
            } else {
                orig.deleteAttribute(c.cred, c.attr);
            }
        }
        this.setCredentialStruct(tx, orig);
    }

    public setCredential(tx: Transaction, cred: Credential) {
        const credStruct = this.getValue();
        credStruct.setCredential(cred.name, cred);
        this.setCredentialStruct(tx, credStruct);
    }

    public setCredentialStruct(tx: Transaction, credStruct: CredentialStruct) {
        const versionBuf = Buffer.alloc(4);
        versionBuf.writeInt32LE(this.credPublic.version.getValue() + 1, 0);
        credStruct.setAttribute(ECredentials.pub, EAttributesPublic.version, versionBuf);
        tx.invoke(this.id, CredentialsInstance.contractID,
            CredentialsInstance.commandUpdate, [
                new Argument({
                    name: CredentialsInstance.argumentCredential,
                    value: credStruct.toBytes()
                })
            ]
        );
    }

    public getCredentialInstanceMapBS(name: ECredentials): CredentialInstanceMapBS {
        return CredentialInstanceMapBS.fromScratch(this.bs, this.getCredentialBS(name));
    }
}

export class CredentialBS extends BehaviorSubject<Credential> {
    constructor(private bs: BasicStuff, private csbs: CredentialStructBS,
                private cred: ECredentials, cbs: BehaviorSubject<Credential>) {
        super(cbs.getValue());
        cbs.subscribe(this);
    }

    public static fromScratch(bs: BasicStuff, csbs: CredentialStructBS, name: ECredentials): CredentialBS {
        return new CredentialBS(bs, csbs, name,
            ConvertBS(csbs, cs => cs.getCredential(name)));
    }

    private static getAttribute(cred: Credential, name: string): Buffer | undefined {
        const attr = cred.attributes.find((a) => a.name.toString() === name);
        if (attr === undefined) {
            return undefined;
        }
        return attr.value;
    }

    public getAttributeBufferBS(name: string): AttributeBufferBS {
        const bs = this.getAttributeBS(name);
        return new AttributeBufferBS(this.bs, this, bs, name);
    }

    public getAttributeStringBS(name: string): AttributeStringBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => buf.toString());
        return new AttributeStringBS(this.bs, this, bs, name);
    }

    public getAttributeLongBS(name: string): AttributeLongBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => Long.fromBytesLE(Array.from(buf)));
        return new AttributeLongBS(this.bs, this, bs, name);
    }

    public getAttributePointBS(name: string): AttributePointBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => {
            try {
                return PointFactory.fromProto(buf)
            } catch (e) {
                return undefined;
            }
        });
        return new AttributePointBS(this.bs, this, bs, name);
    }

    public getAttributeBoolBS(name: string): AttributeBoolBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => buf.toString() === "true");
        return new AttributeBoolBS(this.bs, this, bs, name);
    }

    public getAttributeNumberBS(name: string): AttributeNumberBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => buf.readInt32LE(0));
        return new AttributeNumberBS(this.bs, this, bs, name);
    }

    public getAttributeInstanceSetBS(name: string): AttributeInstanceSetBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => new InstanceSet(buf));
        return new AttributeInstanceSetBS(this.bs, this, bs, name);
    }

    public setValue(tx: Transaction, attr: string, value: string | Buffer) {
        this.csbs.updateCredential(tx, {cred: this.cred, attr, value})
    }

    public rmValue(tx: Transaction, attr: string) {
        this.setValue(tx, attr, undefined);
    }

    public set(tx: Transaction, cred: Credential) {
        this.csbs.setCredential(tx, cred);
    }

    private getAttributeBS(name: string): BehaviorSubject<Buffer> {
        const bs = new BehaviorSubject<Buffer | undefined>(
            CredentialBS.getAttribute(this.getValue(), name) || Buffer.alloc(0));
        this.pipe(
            map((cred) => CredentialBS.getAttribute(cred, name)),
            filter((cred) => cred !== undefined),
            distinctUntilChanged((a, b) => a.equals(b))
        ).subscribe(bs);
        return bs;
    }
}

export class CredentialInstanceMapBS extends BehaviorSubject<InstanceMap> {
    constructor(bs: BasicStuff, private cbs: CredentialBS,
                bsim: BehaviorSubject<InstanceMap>) {
        super(bsim.getValue());
        bsim.subscribe(this);
    }

    public static fromScratch(bs: BasicStuff, cbs: CredentialBS): CredentialInstanceMapBS {
        return new CredentialInstanceMapBS(bs, cbs,
            ConvertBS(cbs, c => new InstanceMap(c)),
        )
    }

    public setInstanceMap(tx: Transaction, val: InstanceMap) {
        const cred = this.cbs.getValue();
        cred.attributes.splice(0);
        Array.from(val.map.entries()).forEach(([name, value]) =>
            cred.attributes.push(new Attribute({name, value})));
        this.cbs.set(tx, cred);
    }

    public setValue(tx: Transaction, name: string, value: Buffer) {
        const val = this.getValue();
        val.map.set(name, value);
        return this.setInstanceMap(tx, val);
    }

    public rmValue(tx: Transaction, name: string) {
        const val = this.getValue();
        val.map.delete(name);
        this.setInstanceMap(tx, val);
    }
}

export class AttributeBufferBS extends BehaviorSubject<Buffer> {
    constructor(private bs: BasicStuff, private cbs: CredentialBS,
                bsb: BehaviorSubject<Buffer>, private name: string) {
        super(bsb.getValue());
        bsb.subscribe(this);
    }

    public setValue(tx: Transaction, val: Buffer) {
        return this.cbs.setValue(tx, this.name, val);
    }
}

export class AttributeStringBS extends BehaviorSubject<string> {
    constructor(private bs: BasicStuff, private cbs: CredentialBS,
                bss: BehaviorSubject<string>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: Transaction, val: string) {
        return this.cbs.setValue(tx, this.name, val);
    }
}

export class AttributeLongBS extends BehaviorSubject<Long> {
    constructor(private bs: BasicStuff, private cbs: CredentialBS,
                bss: BehaviorSubject<Long>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: Transaction, val: Long) {
        return this.cbs.setValue(tx, this.name, Buffer.from(val.toBytesLE()));
    }
}

export class AttributePointBS extends BehaviorSubject<Point> {
    constructor(private bs: BasicStuff, private cbs: CredentialBS,
                bss: BehaviorSubject<Point>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: Transaction, val: Point) {
        return this.cbs.setValue(tx, this.name, val.toProto());
    }
}

export class AttributeBoolBS extends BehaviorSubject<boolean> {
    constructor(private bs: BasicStuff, private cbs: CredentialBS,
                bss: BehaviorSubject<boolean>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: Transaction, val: boolean) {
        return this.cbs.setValue(tx, this.name, Buffer.from(val ? "true" : "false"));
    }
}

export class AttributeNumberBS extends BehaviorSubject<number> {
    constructor(private bs: BasicStuff, private cbs: CredentialBS,
                bss: BehaviorSubject<number>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: Transaction, val: number) {
        const buf = Buffer.alloc(4);
        buf.writeInt32LE(val, 0);
        return this.cbs.setValue(tx, this.name, buf);
    }
}

export class AttributeInstanceSetBS extends BehaviorSubject<InstanceSet> {
    constructor(private bs: BasicStuff, private cbs: CredentialBS,
                bsis: BehaviorSubject<InstanceSet>, private name: string) {
        super(bsis.getValue());
        bsis.subscribe(this);
    }

    public setInstanceSet(tx: Transaction, val: InstanceSet) {
        this.cbs.setValue(tx, this.name, val.toBuffer());
    }
}

export enum EAttributesPublic {
    contacts = "contactsBuf",
    alias = "alias",
    email = "email",
    coinID = "coin",
    seedPub = "seedPub",
    phone = "phone",
    actions = "actions",
    groups = "groups",
    url = "url",
    challenge = "challenge",
    personhood = "personhood",
    subscribe = "subscribe",
    snacked = "snacked",
    version = "version"
}

export class CredentialPublic {
    public contacts: AttributeInstanceSetBS;
    public alias: AttributeStringBS;
    public email: AttributeStringBS;
    public coinID: AttributeBufferBS;
    public seedPub: AttributeBufferBS;
    public phone: AttributeStringBS;
    public actions: AttributeInstanceSetBS;
    public groups: AttributeInstanceSetBS;
    public url: AttributeStringBS;
    public challenge: AttributeLongBS;
    public personhood: AttributePointBS;
    public subscribe: AttributeBoolBS;
    public snacked: AttributeBoolBS;
    public version: AttributeNumberBS;

    constructor(cbs: CredentialBS) {
        this.contacts = cbs.getAttributeInstanceSetBS(EAttributesPublic.contacts);
        this.alias = cbs.getAttributeStringBS(EAttributesPublic.alias);
        this.email = cbs.getAttributeStringBS(EAttributesPublic.email);
        this.coinID = cbs.getAttributeBufferBS(EAttributesPublic.coinID);
        this.seedPub = cbs.getAttributeBufferBS(EAttributesPublic.seedPub);
        this.phone = cbs.getAttributeStringBS(EAttributesPublic.phone);
        this.actions = cbs.getAttributeInstanceSetBS(EAttributesPublic.actions);
        this.groups = cbs.getAttributeInstanceSetBS(EAttributesPublic.groups);
        this.url = cbs.getAttributeStringBS(EAttributesPublic.url);
        this.challenge = cbs.getAttributeLongBS(EAttributesPublic.challenge);
        this.personhood = cbs.getAttributePointBS(EAttributesPublic.personhood);
        this.subscribe = cbs.getAttributeBoolBS(EAttributesPublic.subscribe);
        this.snacked = cbs.getAttributeBoolBS(EAttributesPublic.snacked);
        this.version = cbs.getAttributeNumberBS(EAttributesPublic.version);
    }
}

export enum EAttributesConfig {
    view = "view",
    spawner = "spawner",
    structVersion = "structVersion",
    ltsID = "ltsID",
    ltsX = "ltsX",
}

export class CredentialConfig {
    public view: AttributeStringBS;
    public spawnerID: AttributeBufferBS;
    public structVersion: AttributeNumberBS;
    public ltsID: AttributeBufferBS;
    public ltsX: AttributePointBS;

    constructor(cbs: CredentialBS) {
        this.view = cbs.getAttributeStringBS(EAttributesConfig.view);
        this.spawnerID = cbs.getAttributeBufferBS(EAttributesConfig.spawner);
        this.structVersion = cbs.getAttributeNumberBS(EAttributesConfig.structVersion);
        this.ltsID = cbs.getAttributeBufferBS(EAttributesConfig.ltsID);
        this.ltsX = cbs.getAttributePointBS(EAttributesConfig.ltsX);
    }
}

export class InstanceSet {
    public readonly set: Set<string>;

    constructor(contacts: Buffer | Credential | null | undefined) {
        this.set = new Set(InstanceSet.splitList(contacts)
            .map(c => c.toString("hex")));
    }

    public static splitList(contacts: Buffer | Credential | null | undefined): Buffer[] {
        const list = [];
        if (contacts instanceof Buffer) {
            for (let i = 0; i < contacts.length; i += 32) {
                list.push(contacts.slice(i, i + 32));
            }
        } else if (contacts instanceof Credential) {
            for (const attr of contacts.attributes) {
                list.push(attr.value);
            }
        }
        return list;
    }

    toBuffer(): Buffer {
        const ret = Buffer.alloc(this.set.size * 32);
        let i = 0;
        this.set.forEach((c) => {
            Buffer.from(c, "hex").copy(ret, i * 32);
            i++;
        });
        return ret;
    }

    toInstanceIDs(): InstanceID[] {
        return Array.from(this.set.values()).map(hex => Buffer.from(hex, "hex"))
    }

    add(contact: InstanceID | string): InstanceSet {
        if (contact instanceof Buffer) {
            this.set.add(contact.toString("hex"));
        } else {
            this.set.add(contact);
        }
        return this;
    }

    rm(contact: InstanceID | string): InstanceSet {
        if (contact instanceof Buffer) {
            this.set.delete(contact.toString("hex"));
        } else {
            this.set.delete(contact);
        }
        return this;
    }

    has(contact: InstanceID | string): boolean {
        if (contact instanceof Buffer) {
            return this.set.has(contact.toString("hex"));
        } else {
            return this.set.has(contact);
        }
    }
}

export class InstanceMap {
    public map: Map<string, Buffer>;

    constructor(private cred?: Credential) {

        this.map = new Map(cred ? cred.attributes.map(attr => [attr.name, attr.value]) : []);
    }

    toCredential(): Credential {
        return new Credential({
            name: this.cred.name,
            attributes: Array.from(this.map)
                .map(m => new Argument({name: m[0], value: m[1]}))
        })
    }

    toInstanceIDs(): InstanceID[] {
        return Array.from(this.map.values());
    }
}
