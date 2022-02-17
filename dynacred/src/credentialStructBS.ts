import Long from "long";
import { BehaviorSubject } from "rxjs";
import { filter } from "rxjs/internal/operators/filter";
import { distinctUntilChanged, map } from "rxjs/operators";

import { Argument, InstanceID } from "@dedis/cothority/byzcoin";
import { Attribute, Credential, CredentialsInstance, CredentialStruct } from "@dedis/cothority/byzcoin/contracts";
import { Point, PointFactory } from "@dedis/kyber";

import { TransactionBuilder } from "./byzcoin";
import { ConvertBS } from "./observableUtils";
import { bufferToObject } from "./utils";

/**
 * The CredentialStructBS is the main part of a user-account in ByzCoin.
 * It references all other instances that are available to the user.
 * This class and its subclasses only hold data that can be interpreted without having to look up something on the
 * chain.
 * For example, the `credDevices` only holds the `InstanceID`s that point to the devices available by this credential.
 * The devices themselves are only available through the `CredentialSignerBS` class, which is referenced in `User`.
 *
 * The credential has a 2-level storage system, that has been arbitrarily chosen to hold the following data:
 *   - public: holds all data about the user that is publicly available. Most of it can be empty.
 *   - config: some configuration data used by the front-end
 *   - devices: implements the naming system to point to all DARCs that have access to this credential
 *   - recoveries: points to all DARCs that have the right to do a recovery of access to this credential
 *   - calypso: a list of all calypso instances held by this credential
 */
export class CredentialStructBS extends BehaviorSubject<CredentialStruct> {
    static readonly structVersionLatest = 2;
    static readonly urlRegistered = "https://qrcode.c4dt.org/registered";
    static readonly urlUnregistered = "https://qrcode.c4dt.org/unregistered";

    credPublic: CredentialPublic;
    credConfig: CredentialConfig;
    credDevices: CredentialInstanceMapBS;
    credRecoveries: CredentialInstanceMapBS;
    credCalypso: CredentialInstanceMapBS;

    constructor(readonly id: InstanceID,
                readonly darcID: InstanceID,
                credBS: BehaviorSubject<CredentialStruct>) {
        super(credBS.getValue());
        credBS.subscribe(this);

        this.credPublic = new CredentialPublic(this.getCredentialBS(ECredentials.pub));
        this.credConfig = new CredentialConfig(this.getCredentialBS(ECredentials.config));
        this.credDevices = this.getCredentialInstanceMapBS(ECredentials.devices);
        this.credRecoveries = this.getCredentialInstanceMapBS(ECredentials.recoveries);
        this.credCalypso = this.getCredentialInstanceMapBS(ECredentials.calypso);
    }

    getCredentialBS(name: ECredentials): CredentialBS {
        return CredentialBS.fromScratch(this, name);
    }

    /**
     * updateCredentials sets all new credentials given in 'cred'.
     * If a value of a Credential is empty, it will be deleted.
     *
     * @param tx
     * @param cred
     */
    updateCredential(tx: TransactionBuilder, ...cred: IUpdateCredential[]) {
        const orig = this.getValue();
        for (const c of cred) {
            if (c.value !== undefined) {
                const value = Buffer.isBuffer(c.value) ? c.value : Buffer.from(c.value);
                orig.setAttribute(c.cred, c.attr, value);
            } else {
                orig.deleteAttribute(c.cred, c.attr);
            }
        }
        this.setCredentialStruct(tx, orig);
    }

    setCredential(tx: TransactionBuilder, cred: Credential) {
        const credStruct = this.getValue();
        credStruct.setCredential(cred.name, cred);
        this.setCredentialStruct(tx, credStruct);
    }

    setCredentialStruct(tx: TransactionBuilder, credStruct: CredentialStruct) {
        const versionBuf = Buffer.alloc(4);
        versionBuf.writeInt32LE(this.credPublic.version.getValue() + 1, 0);
        credStruct.setAttribute(ECredentials.pub, EAttributesPublic.version, versionBuf);
        tx.invoke(this.id, CredentialsInstance.contractID,
            CredentialsInstance.commandUpdate, [
                new Argument({
                    name: CredentialsInstance.argumentCredential,
                    value: credStruct.toBytes(),
                }),
            ],
        );
    }

    getCredentialInstanceMapBS(name: ECredentials): CredentialInstanceMapBS {
        return CredentialInstanceMapBS.fromScratch(this.getCredentialBS(name));
    }
}

export class CredentialBS extends BehaviorSubject<Credential> {

    static fromScratch(csbs: CredentialStructBS, name: ECredentials): CredentialBS {
        return new CredentialBS(csbs, name,
            ConvertBS(csbs, (cs) => cs.getCredential(name) || new Credential({name})));
    }

    private static getAttribute(cred: Credential, name: string): Buffer | undefined {
        const attr = cred.attributes.find((a) => a.name.toString() === name);
        if (attr === undefined) {
            return undefined;
        }
        return attr.value;
    }
    constructor(private csbs: CredentialStructBS,
                private cred: ECredentials, cbs: BehaviorSubject<Credential>) {
        super(cbs.getValue());
        cbs.subscribe(this);
    }

    getAttributeBufferBS(name: string): AttributeBufferBS {
        const bs = this.getAttributeBS(name);
        return new AttributeBufferBS(this, bs, name);
    }

    getAttributeStringBS(name: string): AttributeStringBS {
        const bs = ConvertBS(this.getAttributeBS(name), (buf) => buf.toString());
        return new AttributeStringBS(this, bs, name);
    }

    getAttributeLongBS(name: string): AttributeLongBS {
        const bs = ConvertBS(this.getAttributeBS(name), (buf) => Long.fromBytesLE(Array.from(buf)));
        return new AttributeLongBS(this, bs, name);
    }

    getAttributePointBS(name: string): AttributePointBS {
        const bs = ConvertBS(this.getAttributeBS(name), (buf) => {
            try {
                return PointFactory.fromProto(buf);
            } catch (e) {
                return undefined;
            }
        });
        return new AttributePointBS(this, bs, name);
    }

    getAttributeBoolBS(name: string): AttributeBoolBS {
        const bs = ConvertBS(this.getAttributeBS(name), (buf) => buf.toString() === "true");
        return new AttributeBoolBS(this, bs, name);
    }

    getAttributeNumberBS(name: string): AttributeNumberBS {
        const bs = ConvertBS(this.getAttributeBS(name), (buf) =>
            buf && buf.length === 4 ? buf.readInt32LE(0) : 0);
        return new AttributeNumberBS(this, bs, name);
    }

    getAttributeInstanceSetBS(name: string): AttributeInstanceSetBS {
        const bs = ConvertBS(this.getAttributeBS(name), (buf) => new InstanceSet(buf));
        return new AttributeInstanceSetBS(this, bs, name);
    }

    setValue(tx: TransactionBuilder, attr: string, value: string | Buffer) {
        this.csbs.updateCredential(tx, {cred: this.cred, attr, value});
    }

    rmValue(tx: TransactionBuilder, attr: string) {
        this.setValue(tx, attr, undefined);
    }

    set(tx: TransactionBuilder, cred: Credential) {
        this.csbs.setCredential(tx, cred);
    }

    private getAttributeBS(name: string): BehaviorSubject<Buffer> {
        const bs = new BehaviorSubject<Buffer | undefined>(
            CredentialBS.getAttribute(this.getValue(), name) || Buffer.alloc(0));
        this.pipe(
            map((cred) => CredentialBS.getAttribute(cred, name)),
            filter((cred) => cred !== undefined),
            distinctUntilChanged((a, b) => a.equals(b)),
        ).subscribe(bs);
        return bs;
    }
}

export class CredentialInstanceMapBS extends BehaviorSubject<InstanceMap> {

    static fromScratch(cbs: CredentialBS): CredentialInstanceMapBS {
        return new CredentialInstanceMapBS(cbs,
            ConvertBS(cbs, (c) => new InstanceMap(c)),
        );
    }
    constructor(private cbs: CredentialBS,
                bsim: BehaviorSubject<InstanceMap>) {
        super(bsim.getValue());
        bsim.subscribe(this);
    }

    setInstanceMap(tx: TransactionBuilder, val: InstanceMap) {
        const cred = this.cbs.getValue();
        cred.attributes.splice(0);
        Array.from(val.map.entries()).forEach(([idStr, name]) =>
            cred.attributes.push(new Attribute({name, value: Buffer.from(idStr, "hex")})));
        this.cbs.set(tx, cred);
    }

    setEntry(tx: TransactionBuilder, name: string, id: Buffer) {
        const val = this.getValue();
        val.map.set(id.toString("hex"), name);
        return this.setInstanceMap(tx, val);
    }

    rmEntry(tx: TransactionBuilder, id: Buffer) {
        const val = this.getValue();
        val.map.delete(id.toString("hex"));
        this.setInstanceMap(tx, val);
    }

    hasEntry(id: Buffer): boolean {
        return this.getValue().map.has(id.toString("hex"));
    }

    getEntry(id: Buffer): string {
        return this.getValue().map.get(id.toString("hex"));
    }
}

export class AttributeBufferBS extends BehaviorSubject<Buffer> {
    constructor(private cbs: CredentialBS,
                bsb: BehaviorSubject<Buffer>, private name: string) {
        super(bsb.getValue());
        bsb.subscribe(this);
    }

    setValue(tx: TransactionBuilder, val: Buffer) {
        return this.cbs.setValue(tx, this.name, val);
    }
}

export class AttributeStringBS extends BehaviorSubject<string> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<string>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    setValue(tx: TransactionBuilder, val: string) {
        return this.cbs.setValue(tx, this.name, val);
    }
}

export class AttributeLongBS extends BehaviorSubject<Long> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<Long>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    setValue(tx: TransactionBuilder, val: Long) {
        return this.cbs.setValue(tx, this.name, Buffer.from(val.toBytesLE()));
    }
}

export class AttributePointBS extends BehaviorSubject<Point | undefined> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<Point | undefined>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    setValue(tx: TransactionBuilder, val: Point) {
        return this.cbs.setValue(tx, this.name, val.toProto());
    }
}

export class AttributeBoolBS extends BehaviorSubject<boolean> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<boolean>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    setValue(tx: TransactionBuilder, val: boolean) {
        return this.cbs.setValue(tx, this.name, Buffer.from(val ? "true" : "false"));
    }
}

export class AttributeNumberBS extends BehaviorSubject<number> {
    constructor(private cbs: CredentialBS,
                bss: BehaviorSubject<number>, private name: string) {
        super(bss.getValue());
        bss.subscribe(this);
    }

    setValue(tx: TransactionBuilder, val: number) {
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

    setInstanceSet(tx: TransactionBuilder, val: InstanceSet) {
        this.cbs.setValue(tx, this.name, val.toBuffer());
    }
}

/**
 *
 */
export class CredentialPublic {
    contacts: AttributeInstanceSetBS;
    alias: AttributeStringBS;
    email: AttributeStringBS;
    coinID: AttributeBufferBS;
    seedPub: AttributeBufferBS;
    phone: AttributeStringBS;
    actions: AttributeInstanceSetBS;
    groups: AttributeInstanceSetBS;
    url: AttributeStringBS;
    challenge: AttributeLongBS;
    personhood: AttributePointBS;
    subscribe: AttributeBoolBS;
    snacked: AttributeBoolBS;
    version: AttributeNumberBS;

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
    view: AttributeStringBS;
    spawnerID: AttributeBufferBS;
    structVersion: AttributeNumberBS;
    ltsID: AttributeBufferBS;
    ltsX: AttributePointBS;

    constructor(cbs: CredentialBS) {
        this.view = cbs.getAttributeStringBS(EAttributesConfig.view);
        this.spawnerID = cbs.getAttributeBufferBS(EAttributesConfig.spawner);
        this.structVersion = cbs.getAttributeNumberBS(EAttributesConfig.structVersion);
        this.ltsID = cbs.getAttributeBufferBS(EAttributesConfig.ltsID);
        this.ltsX = cbs.getAttributePointBS(EAttributesConfig.ltsX);
    }
}

export class InstanceSet {

    static splitList(contacts: Buffer | Credential | null | undefined): Buffer[] {
        const list = [];
        if (Buffer.isBuffer(contacts)) {
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
    readonly set: Set<string>;

    constructor(contacts: Buffer | Credential | null | undefined) {
        this.set = new Set(InstanceSet.splitList(contacts)
            .map((c) => c.toString("hex")));
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
        return Array.from(this.set.values()).map((hex) => Buffer.from(hex, "hex"));
    }

    add(contact: InstanceID | string): InstanceSet {
        if (Buffer.isBuffer(contact)) {
            this.set.add(contact.toString("hex"));
        } else {
            this.set.add(contact);
        }
        return this;
    }

    rm(contact: InstanceID | string): InstanceSet {
        if (Buffer.isBuffer(contact)) {
            this.set.delete(contact.toString("hex"));
        } else {
            this.set.delete(contact);
        }
        return this;
    }

    has(contact: InstanceID | string): boolean {
        if (Buffer.isBuffer(contact)) {
            return this.set.has(contact.toString("hex"));
        } else {
            return this.set.has(contact);
        }
    }
}

export class InstanceMap {
    // Even though we map id:string, we need to use the .toString("hex"), so that the
    // map functions - keys cannot be Buffers :(
    map: Map<string, string>;

    constructor(private cred?: Credential) {
        this.map = new Map(cred ? cred.attributes.map((attr) =>
            [attr.value.toString("hex"), attr.name]) : []);
    }

    toCredential(): Credential {
        return new Credential({
            attributes: Array.from(this.map)
                .map((m) => new Argument({name: m[1], value: Buffer.from(m[0], "hex")})),
            name: this.cred.name,
        });
    }

    toInstanceIDs(): InstanceID[] {
        return this.toKVs().map((kv) => kv.key);
    }

    toKVs(): IInstanceMapKV[] {
        return [...this.map.entries()].map((kv) => {
            return {key: Buffer.from(kv[0], "hex"), value: kv[1]};
        });
    }
}

export interface IInstanceMapKV {
    key: Buffer;
    value: string;
}

export enum ECredentials {
    pub = "1-public",
    config = "1-config",
    devices = "1-devices",
    recoveries = "1-recovery",
    calypso = "1-calypso",
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
    version = "version",
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
