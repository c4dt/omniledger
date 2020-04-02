import {filter} from "rxjs/internal/operators/filter";
import {BehaviorSubject} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";
import Long from "long";

import {Attribute, Credential, CredentialsInstance, CredentialStruct} from "@dedis/cothority/byzcoin/contracts";
import {Argument, InstanceID} from "@dedis/cothority/byzcoin";
import {Point, PointFactory} from "@dedis/kyber";

import {ConvertBS} from "./observableUtils";
import {CredentialTransaction} from "./credentialTransaction";
import {bufferToObject} from "./utils";
import Log from "@dedis/cothority/log";

export enum ECredentials {
    pub = "1-public",
    config = "1-config",
    devices = "1-devices",
    recoveries = "1-recovery",
    calypso = "1-calypso"
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

export enum EAttributesConfig {
    view = "view",
    spawner = "spawner",
    structVersion = "structVersion",
    ltsID = "ltsID",
    ltsX = "ltsX",
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
    public credCalypso: CredentialInstanceMapBS;

    constructor(public readonly id: InstanceID,
                public readonly darcID: InstanceID,
                credBS: BehaviorSubject<CredentialStruct>) {
        super(credBS.getValue());
        credBS.subscribe(this);

        this.credPublic = new CredentialPublic(this.getCredentialBS(ECredentials.pub));
        this.credConfig = new CredentialConfig(this.getCredentialBS(ECredentials.config));
        this.credDevices = this.getCredentialInstanceMapBS(ECredentials.devices);
        this.credRecoveries = this.getCredentialInstanceMapBS(ECredentials.recoveries);
        this.credCalypso = this.getCredentialInstanceMapBS(ECredentials.calypso);
    }

    public getCredentialBS(name: ECredentials): CredentialBS {
        return CredentialBS.fromScratch(this, name);
    }

    // updateCredentials sets all new credentials given in 'cred' and then
    // sends a ClientTransaction to Byzcoin.
    // If a value of a Credential is empty, it will be deleted.
    public updateCredential(tx: CredentialTransaction, ...cred: IUpdateCredential[]) {
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

    public setCredential(tx: CredentialTransaction, cred: Credential) {
        const credStruct = this.getValue();
        credStruct.setCredential(cred.name, cred);
        this.setCredentialStruct(tx, credStruct);
    }

    public setCredentialStruct(tx: CredentialTransaction, credStruct: CredentialStruct) {
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
        return CredentialInstanceMapBS.fromScratch(this.getCredentialBS(name));
    }
}

export class CredentialBS extends BehaviorSubject<Credential> {
    constructor(private csbs: CredentialStructBS,
                private cred: ECredentials, cbs: BehaviorSubject<Credential>) {
        super(cbs.getValue());
        cbs.subscribe(this);
    }

    public static fromScratch(csbs: CredentialStructBS, name: ECredentials): CredentialBS {
        return new CredentialBS(csbs, name,
            ConvertBS(csbs, cs => cs.getCredential(name) || new Credential({name})));
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
        return new AttributeBufferBS(this, bs, name);
    }

    public getAttributeStringBS(name: string): AttributeStringBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => buf.toString());
        return new AttributeStringBS(this, bs, name);
    }

    public getAttributeLongBS(name: string): AttributeLongBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => Long.fromBytesLE(Array.from(buf)));
        return new AttributeLongBS(this, bs, name);
    }

    public getAttributePointBS(name: string): AttributePointBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => {
            try {
                return PointFactory.fromProto(buf)
            } catch (e) {
                return undefined;
            }
        });
        return new AttributePointBS(this, bs, name);
    }

    public getAttributeBoolBS(name: string): AttributeBoolBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => buf.toString() === "true");
        return new AttributeBoolBS(this, bs, name);
    }

    public getAttributeNumberBS(name: string): AttributeNumberBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf =>
            buf && buf.length == 4 ? buf.readInt32LE(0) : 0);
        return new AttributeNumberBS(this, bs, name);
    }

    public getAttributeInstanceSetBS(name: string): AttributeInstanceSetBS {
        const bs = ConvertBS(this.getAttributeBS(name), buf => new InstanceSet(buf));
        return new AttributeInstanceSetBS(this, bs, name);
    }

    public setValue(tx: CredentialTransaction, attr: string, value: string | Buffer) {
        this.csbs.updateCredential(tx, {cred: this.cred, attr, value})
    }

    public rmValue(tx: CredentialTransaction, attr: string) {
        this.setValue(tx, attr, undefined);
    }

    public set(tx: CredentialTransaction, cred: Credential) {
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
    constructor(private cbs: CredentialBS,
                bsim: BehaviorSubject<InstanceMap>) {
        super(bsim.getValue());
        bsim.subscribe(this);
    }

    public static fromScratch(cbs: CredentialBS): CredentialInstanceMapBS {
        return new CredentialInstanceMapBS(cbs,
            ConvertBS(cbs, c => new InstanceMap(c)),
        )
    }

    public setInstanceMap(tx: CredentialTransaction, val: InstanceMap) {
        const cred = this.cbs.getValue();
        cred.attributes.splice(0);
        Array.from(val.map.entries()).forEach(([idStr, name]) =>
            cred.attributes.push(new Attribute({name, value: Buffer.from(idStr, "hex")})));
        this.cbs.set(tx, cred);
    }

    public setEntry(tx: CredentialTransaction, name: string, id: Buffer) {
        const val = this.getValue();
        val.map.set(id.toString("hex"), name);
        return this.setInstanceMap(tx, val);
    }

    public rmEntry(tx: CredentialTransaction, id: Buffer) {
        const val = this.getValue();
        val.map.delete(id.toString("hex"));
        this.setInstanceMap(tx, val);
    }

    public hasEntry(id: Buffer): boolean {
        return this.getValue().map.has(id.toString("hex"));
    }

    public getEntry(id: Buffer): string {
        return this.getValue().map.get(id.toString("hex"));
    }
}

export class AttributeBufferBS extends BehaviorSubject<Buffer> {
    constructor(private cbs: CredentialBS,
                bsb: BehaviorSubject<Buffer>, private name: string) {
        super(bsb.getValue());
        bsb.subscribe(this);
    }

    public setValue(tx: CredentialTransaction, val: Buffer) {
        return this.cbs.setValue(tx, this.name, val);
    }
}

export class AttributeStringBS extends BehaviorSubject<string> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<string>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: CredentialTransaction, val: string) {
        return this.cbs.setValue(tx, this.name, val);
    }
}

export class AttributeLongBS extends BehaviorSubject<Long> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<Long>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: CredentialTransaction, val: Long) {
        return this.cbs.setValue(tx, this.name, Buffer.from(val.toBytesLE()));
    }
}

export class AttributePointBS extends BehaviorSubject<Point> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<Point>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: CredentialTransaction, val: Point) {
        return this.cbs.setValue(tx, this.name, val.toProto());
    }
}

export class AttributeBoolBS extends BehaviorSubject<boolean> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<boolean>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: CredentialTransaction, val: boolean) {
        return this.cbs.setValue(tx, this.name, Buffer.from(val ? "true" : "false"));
    }
}

export class AttributeNumberBS extends BehaviorSubject<number> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<number>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    public setValue(tx: CredentialTransaction, val: number) {
        const buf = Buffer.alloc(4);
        buf.writeInt32LE(val, 0);
        return this.cbs.setValue(tx, this.name, buf);
    }
}

export class AttributeInstanceSetBS extends BehaviorSubject<InstanceSet> {
    constructor(private cbs: CredentialBS,
                bsis: BehaviorSubject<InstanceSet>, private name: string) {
        super(bsis.getValue());
        bsis.subscribe(this);
    }

    public setInstanceSet(tx: CredentialTransaction, val: InstanceSet) {
        this.cbs.setValue(tx, this.name, val.toBuffer());
    }
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
            if (contacts.toString().startsWith(`[{"type":"Buffer","data":`)) {
                const ids = bufferToObject(contacts) as Buffer[];
                list.push(...ids);
            } else {
                for (let i = 0; i < contacts.length; i += 32) {
                    list.push(contacts.slice(i, i + 32));
                }
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
    // Even though we map id:string, we need to use the .toString("hex"), so that the
    // map functions - keys cannot be Buffers :(
    public map: Map<string, string>;

    constructor(private cred?: Credential) {
        this.map = new Map(cred ? cred.attributes.map(attr =>
            [attr.value.toString("hex"), attr.name]) : []);
    }

    toCredential(): Credential {
        return new Credential({
            name: this.cred.name,
            attributes: Array.from(this.map)
                .map(m => new Argument({name: m[1], value: Buffer.from(m[0], "hex")}))
        })
    }

    toInstanceIDs(): InstanceID[] {
        return this.toKVs().map(kv => kv.key);
    }

    toKVs(): InstanceMapKV[] {
        return [...this.map.entries()].map(kv => {
            return {key: Buffer.from(kv[0], "hex"), value: kv[1]}
        })
    }
}

export interface InstanceMapKV {
    key: Buffer,
    value: string
}
