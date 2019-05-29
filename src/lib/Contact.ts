import { Point, PointFactory } from "@dedis/kyber";
import { Buffer } from "buffer";
import Long from "long";
import { sprintf } from "sprintf-js";
import ByzCoinRPC from "src/lib/cothority/byzcoin/byzcoin-rpc";
import CoinInstance from "src/lib/cothority/byzcoin/contracts/coin-instance";
import DarcInstance from "src/lib/cothority/byzcoin/contracts/darc-instance";
import { InstanceID } from "src/lib/cothority/byzcoin/instance";
import { CalypsoReadInstance, CalypsoWriteInstance, LongTermSecret } from "src/lib/cothority/calypso";
import { IdentityDarc } from "src/lib/cothority/darc";
import { Rule } from "src/lib/cothority/darc";
import Darc from "src/lib/cothority/darc/darc";
import IdentityEd25519 from "src/lib/cothority/darc/identity-ed25519";
import Signer from "src/lib/cothority/darc/signer";
import Log from "src/lib/cothority/log";
import CredentialsInstance, { CredentialStruct } from "src/lib/cothority/personhood/credentials-instance";
import SpawnerInstance from "src/lib/cothority/personhood/spawner-instance";
import { Data } from "./Data";
import { Public } from "./KeyPair";
import { parseQRCode } from "./Scan";
import { SecureData } from "./SecureData";

// const ZXing = require("nativescript-zxing");
// const QRGenerator = new ZXing();

/**
 * Contact represents a user that is either registered or not. It holds
 * all data in an internal CredentialStruct, and can synchronize in two ways
 * with a CredentialsInstance:
 *
 * 1. update a CredentialsInstance with the current data in the CredentialStruct
 * 2. update the current data in the CredentialStruct from a CredentialsInstance
 *
 * 1. is used to update the data on ByzCoin
 * 2. can be used to fetch the latest data from ByzCoin
 */
export class Contact {
    static readonly structVersionLatest = 1;

    get version(): number {
        return Contact.getVersion(this.credential);
    }

    set version(v: number) {
        Contact.setVersion(this.credential, v);
    }

    get structVersion(): number {
        const svBuf = this.credential.getAttribute("1-config", "structVersion");
        if (!svBuf || svBuf.length === 0) {
            return 0;
        }
        return svBuf.readInt32LE(0);
    }

    get credentialIID(): InstanceID {
        return CredentialsInstance.credentialIID(this.seedPublic.toBuffer());
    }

    get alias(): string {
        const a = this.credential.getAttribute("1-public", "alias");
        if (a) {
            return a.toString();
        }
        return "";
    }

    set alias(a: string) {
        if (a) {
            this.credential.setAttribute("1-public", "alias", Buffer.from(a));
            this.incVersion();
        }
    }

    get email(): string {
        const e = this.credential.getAttribute("1-public", "email");
        if (e) {
            return e.toString();
        }
        return "";
    }

    set email(e: string) {
        if (e) {
            this.credential.setAttribute("1-public", "email", Buffer.from(e));
            this.incVersion();
        }
    }

    get url(): string {
        const u = this.credential.getAttribute("1-public", "url");
        if (u) {
            return u.toString();
        }
        return "";
    }

    set url(u: string) {
        if (u) {
            this.credential.setAttribute("1-public", "url", Buffer.from(u));
            this.incVersion();
        }
    }

    get contacts(): Contact[] {
        return this.contactsCache;
    }

    set contacts(cs: Contact[]) {
        if (cs) {
            this.contactsCache = cs;
            const csBuf = Buffer.concat(cs.map((c) => c.credentialIID));
            this.credential.setAttribute("1-public", "contactsBuf", csBuf);
            this.incVersion();
        }
    }

    get phone(): string {
        const p = this.credential.getAttribute("1-public", "phone");
        if (p) {
            return p.toString();
        }
        return "";
    }

    set phone(p: string) {
        if (p) {
            this.credential.setAttribute("1-public", "phone", Buffer.from(p));
            this.incVersion();
        }
    }

    get seedPublic(): Public {
        return Public.fromBuffer(this.credential.getAttribute("1-public", "seedPub"));
    }

    set seedPublic(pub: Public) {
        if (pub) {
            this.credential.setAttribute("1-public", "seedPub", pub.toBuffer());
            this.incVersion();
        }
    }

    get coinID(): InstanceID {
        return this.credential.getAttribute("1-public", "coin");
    }

    set coinID(id: InstanceID) {
        if (id) {
            this.credential.setAttribute("1-public", "coin", id);
            this.incVersion();
        }
    }

    get ltsID(): InstanceID {
        return this.credential.getAttribute("1-config", "ltsID");
    }

    set ltsID(id: InstanceID) {
        if (id) {
            this.credential.setAttribute("1-config", "ltsID", id);
            this.incVersion();
        }
    }

    get ltsX(): Point {
        return PointFactory.fromProto(this.credential.getAttribute("1-config", "ltsX"));
    }

    set ltsX(X: Point) {
        if (X) {
            this.credential.setAttribute("1-config", "ltsX", X.toProto());
            this.incVersion();
        }
    }

    get spawnerID(): InstanceID {
        return this.credential.getAttribute("1-config", "spawner");
    }

    set spawnerID(id: InstanceID) {
        if (id) {
            this.credential.setAttribute("1-config", "spawner", id);
            this.incVersion();
        }
    }

    get view(): string {
        const v = this.credential.getAttribute("1-config", "view");
        if (v) {
            return v.toString();
        }
        return "default";
    }

    set view(v: string) {
        this.credential.setAttribute("1-config", "view", Buffer.from(v));
        this.incVersion();
    }

    get subscribe(): boolean {
        const sub = this.credential.getAttribute("1-public", "subscribe");
        return sub && sub.equals(Buffer.from("true"));
    }

    set subscribe(c: boolean) {
        this.credential.setAttribute("1-public", "subscribe",
            c ? Buffer.from("true") : Buffer.from("false"));
        this.incVersion();
    }

    static readonly urlRegistered = "https://pop.dedis.ch/qrcode/identity-2";
    static readonly urlUnregistered = "https://pop.dedis.ch/qrcode/unregistered-2";

    /**
     * Helper to create a user darc
     *
     * @param pubKey    The user public key
     * @param alias     The user alias
     * @returns the new darc
     */
    static prepareUserDarc(pubKey: Point, alias: string): Darc {
        const id = new IdentityEd25519({point: pubKey.marshalBinary()});

        const darc = Darc.createBasic([id], [id], Buffer.from(`user ${alias}`));
        darc.addIdentity("invoke:coin.update", id, Rule.AND);
        darc.addIdentity("invoke:coin.fetch", id, Rule.AND);
        darc.addIdentity("invoke:coin.transfer", id, Rule.AND);
        darc.addIdentity("invoke:credential.update", id, Rule.AND);

        return darc;
    }

    static prepareInitialCred(alias: string, pub: Public, spawner: InstanceID, deviceDarcID: InstanceID,
                              lts: LongTermSecret): CredentialStruct {
        const cred = new CredentialStruct();
        cred.setAttribute("1-public", "alias", Buffer.from(alias));
        cred.setAttribute("1-public", "coin", CoinInstance.coinIID(pub.toBuffer()));
        cred.setAttribute("1-public", "version", Buffer.from(Long.fromNumber(0).toBytesLE()));
        cred.setAttribute("1-public", "seedPub", pub.toBuffer());
        cred.setAttribute("1-config", "spawner", spawner);
        const svBuf = Buffer.alloc(4);
        svBuf.writeInt32LE(Contact.structVersionLatest, 0);
        cred.setAttribute("1-config", "structVersion", svBuf);
        cred.setAttribute("1-devices", "initial", deviceDarcID);
        if (lts) {
            cred.setAttribute("1-config", "ltsID", lts.id);
            cred.setAttribute("1-config", "ltsX", lts.X.toProto());
        }
        return cred;
    }

    static fromObject(obj: any): Contact {
        const u = new Contact();
        if (obj.credential) {
            u.credential = CredentialStruct.decode(Buffer.from(obj.credential));
        }
        if (obj.calypso) {
            u.calypso = Calypso.fromObject(u, obj.calypso);
        }
        return u;
    }

    static async fromObjectBC(bc: ByzCoinRPC, obj: any): Promise<Contact> {
        const u = Contact.fromObject(obj);
        await u.updateOrConnect(bc);
        return u;
    }

    static async fromQR(bc: ByzCoinRPC, str: string): Promise<Contact> {
        const qr = await parseQRCode(str, 5);
        const u = new Contact();
        switch (qr.url) {
            case Contact.urlRegistered:
                u.credentialInstance = await CredentialsInstance.fromByzcoin(bc,
                    Buffer.from(qr.credentialIID, "hex"));
                u.credential = u.credentialInstance.credential.copy();
                u.darcInstance = await DarcInstance.fromByzcoin(bc, u.credentialInstance.darcID);
                return await u.updateOrConnect();
            case Contact.urlUnregistered:
                u.alias = qr.alias;
                u.email = qr.email;
                u.phone = qr.phone;
                u.seedPublic = Public.fromHex(qr.public_ed25519);
                return u;
            default:
                return Promise.reject("invalid URL");
        }
    }

    static async fromByzcoin(bc: ByzCoinRPC, credIID: InstanceID): Promise<Contact> {
        const u = new Contact();
        u.credentialInstance = await CredentialsInstance.fromByzcoin(bc, credIID);
        u.credential = u.credentialInstance.credential.copy();
        u.darcInstance = await DarcInstance.fromByzcoin(bc, u.credentialInstance.darcID);
        u.coinInstance = await CoinInstance.fromByzcoin(bc, u.getCoinAddress());
        return u;
    }

    static setVersion(c: CredentialStruct, v: number) {
        const b = Buffer.alloc(4);
        b.writeUInt32LE(v, 0);
        c.setAttribute("1-public", "version", b);
    }

    static getVersion(c: CredentialStruct): number {
        const b = c.getAttribute("1-public", "version");
        if (b == null) {
            return 0;
        }
        return b.readUInt32LE(0);
    }

    static sortAlias(cs: IHasAlias[]): IHasAlias[] {
        return cs.sort((a, b) => a.alias.toLocaleLowerCase().localeCompare(b.alias.toLocaleLowerCase()));
    }
    credentialInstance: CredentialsInstance = null;
    darcInstance: DarcInstance = null;
    coinInstance: CoinInstance = null;
    spawnerInstance: SpawnerInstance = null;
    recover: Recover = null;
    calypso: Calypso = null;
    bc: ByzCoinRPC = null;
    contactsCache: Contact[] = null;
    actionsCache: DarcInstance[] = null;
    groupsCache: DarcInstance[] = null;

    constructor(public credential: CredentialStruct = null,
                public data: Data = null) {
        if (credential == null) {
            this.credential = new CredentialStruct();
            Contact.setVersion(this.credential, 0);
        }
        this.recover = new Recover(this);
        this.calypso = new Calypso(this);
    }

    incVersion() {
        this.version = this.version + 1;
    }

    async getActions(): Promise<DarcInstance[]> {
        if (this.actionsCache) {
            return this.actionsCache;
        }
        this.actionsCache = [];
        const acBuf = this.credential.getAttribute("1-public", "actions");
        if (acBuf) {
            const acArray: Buffer[] = JSON.parse(acBuf.toString());
            this.actionsCache = await Promise.all(acArray.map((ac) => {
                return DarcInstance.fromByzcoin(this.bc, Buffer.from(ac));
            }));
        }
        return this.actionsCache;
    }

    setActions(acs: DarcInstance[]) {
        if (acs) {
            this.actionsCache = acs;
            const acBuf = Buffer.from(JSON.stringify(acs.map((ac) => ac.id)));
            this.credential.setAttribute("1-public", "actions", acBuf);
            this.version = this.version + 1;
        }
    }

    async getGroups(): Promise<DarcInstance[]> {
        if (this.groupsCache) {
            return this.groupsCache;
        }
        this.groupsCache = [];
        const acBuf = this.credential.getAttribute("1-public", "groups");
        if (acBuf) {
            const acArray: Buffer[] = JSON.parse(acBuf.toString());
            this.groupsCache = await Promise.all(acArray.map((ac) => {
                return DarcInstance.fromByzcoin(this.bc, Buffer.from(ac));
            }));
        }
        return this.groupsCache;
    }

    setGroups(acs: DarcInstance[]) {
        if (acs) {
            this.groupsCache = acs;
            const acBuf = Buffer.from(JSON.stringify(acs.map((ac) => ac.id)));
            this.credential.setAttribute("1-public", "groups", acBuf);
            this.version = this.version + 1;
        }
    }

    async getDarcSignIdentity(): Promise<IdentityDarc> {
        if (!this.darcInstance) {
            await this.updateOrConnect();
        }
        const signRule = this.darcInstance.darc.rules.list.find((r) => r.action === Darc.ruleSign);
        if (signRule == null) {
            throw new Error("didn't find signer darc");
        }
        const expr = signRule.expr.toString();
        if (expr.match(/\|&/)) {
            throw new Error("don't know what to do with a combined expression");
        }
        if (!expr.startsWith("darc:")) {
            throw new Error("signer is not a darc");
        }
        return new IdentityDarc({id: Buffer.from(expr.substr(5), "hex")});
    }

    /**
     * toObject returns an object that can be used to re-create the full contact. As it contains
     * the secrets in clear, this should never be used to store data on the blockchain.
     */
    toObject(): object {
        return {
            calypso: this.calypso.toObject(),
            credential: this.credential.toBytes(),
        };
    }

    async updateOrConnect(bc: ByzCoinRPC = null, getContacts: boolean = true): Promise<Contact> {
        if (bc) {
            this.bc = bc;
            Log.lvl1("Connecting user", this.alias,
                "with public key", this.seedPublic.toHex(), "and id", this.credentialIID.toString("hex"));
            this.credentialInstance = await CredentialsInstance.fromByzcoin(bc, this.credentialIID);
            this.credential = this.credentialInstance.credential.copy();
            this.darcInstance = await DarcInstance.fromByzcoin(bc, this.credentialInstance.darcID);
            this.coinInstance = await CoinInstance.fromByzcoin(bc, this.coinID);
            this.spawnerInstance = await SpawnerInstance.fromByzcoin(bc, this.spawnerID);
            Log.lvl2("done for", this.alias);
        } else {
            Log.lvl2("Updating user", this.alias);
            await this.credentialInstance.update();
            if (Contact.getVersion(this.credentialInstance.credential) > this.version) {
                this.credential = this.credentialInstance.credential.copy();
                this.contactsCache = null;
            }
            await this.darcInstance.update();
            await this.coinInstance.update();
        }

        for (let i = this.structVersion; i < Contact.structVersionLatest; i++) {
            switch (i) {
                case 0:
                    this.credential.setAttribute("1-devices", "initial", this.seedPublic.toBuffer());
                    break;
            }
        }

        if (getContacts && (!this.contactsCache || this.contactsCache.length === 0)) {
            await this.getContacts();
        }

        return this;
    }

    async getContacts() {
        Log.lvl2("Reloading contacts of", this.alias);
        const csBufOld = this.credential.getAttribute("1-public", "contacts");
        if (csBufOld && csBufOld.length > 0) {
            Log.lvl1("converting old contacts");
            const csArray: string[] = JSON.parse(csBufOld.toString());
            this.contactsCache = csArray.map((c) => Contact.fromObject(c));
            for (const c of this.contactsCache) {
                await c.updateOrConnect(this.bc, false);
            }
            this.credential.setAttribute("1-public", "contacts", Buffer.alloc(0));
            this.contacts = this.contactsCache;
            return;
        }
        const csBuf = this.credential.getAttribute("1-public", "contactsBuf");
        this.contactsCache = [];
        if (csBuf) {
            let hasFaulty: boolean = false;
            for (let c = 0; c < csBuf.length; c += 32) {
                try {
                    const cont = await Contact.fromByzcoin(this.bc, csBuf.slice(c, c + 32));
                    await cont.updateOrConnect(this.bc, false);
                    this.contactsCache.push(cont);
                } catch (e) {
                    Log.error("couldn't get contact - deleting");
                    hasFaulty = false;
                }
            }
            if (hasFaulty) {
                this.contacts = this.contactsCache;
            }
        }
    }

    isRegistered(): boolean {
        return this.credentialIID != null && this.credentialIID.length === 32;
    }

    getCoinAddress(): InstanceID {
        if (!this.credential || !this.credential.credentials) {
            Log.error("don't have the credentials");
            return;
        }
        if (this.coinID != null && this.coinID.length === 32) {
            return this.coinID;
        }
        return CoinInstance.coinIID(this.seedPublic.toBuffer());
    }

    qrcodeIdentityStr(): string {
        let str = Contact.urlUnregistered + "?";
        if (this.isRegistered()) {
            str = sprintf("%s?credentialIID=%s&", Contact.urlRegistered, this.credentialIID.toString("hex"));
        }
        str += sprintf("public_ed25519=%s&alias=%s&email=%s&phone=%s", this.seedPublic.toHex(), this.alias, this.email,
            this.phone);
        return str;
    }

    // qrcodeIdentity(): ImageSource {
    //     const sideLength = screen.mainScreen.widthPixels / 4;
    //     const qrcode = QRGenerator.createBarcode({
    //         encode: this.qrcodeIdentityStr(),
    //         format: ZXing.QR_CODE,
    //         height: sideLength,
    //         width: sideLength
    //     });
    //     return fromNativeSource(qrcode);
    // }

    equals(u: Contact): boolean {
        if (this.credentialIID && u.credentialIID) {
            return this.credentialIID.equals(u.credentialIID);
        }
        return this.alias === u.alias;
    }

    // this method sends the current state of the Credentials to ByzCoin.
    async sendUpdate(signers: Signer[] = null) {
        if (this.credentialInstance != null) {
            if (this.coinInstance && !this.coinID) {
                this.coinID = this.coinInstance.id;
                this.version = this.version + 1;
            }
            if (this.version > Contact.getVersion(this.credentialInstance.credential)) {
                if (!signers) {
                    signers = [this.data.keyIdentitySigner];
                }
                await this.credentialInstance.sendUpdate(signers, this.credential);
            }
        }
    }

    /**
     * getSecureData returns an array of SecureData of this credential that the
     * reader is allowed to access.
     *
     * @param readerDarc the id of the signer-darc
     */
    // async getSecureData(readerDarc: InstanceID): Promise<SecureData[]> {
    // return SecureData.fromContact(this, readerDarc);
    // }

    toString(): string {
        return sprintf("%s (%d): %s\n%s", this.alias, this.version,
            this.credential.credentials.map((c) =>
                sprintf("%s: %s", c.name, c.attributes.map((a) => a.name).join("::"))).join("\n"),
            this.recover);
    }
}

interface IHasAlias {
    alias: string;
}

class Recover {
    constructor(public contact: Contact) {
    }

    get trusteesBuf(): Buffer {
        const b = this.contact.credential.getAttribute("1-recover", "trustees");
        return b == null ? Buffer.alloc(0) : b;
    }

    set trusteesBuf(t: Buffer) {
        this.contact.credential.setAttribute("1-recover", "trustees", t);
        this.contact.incVersion();
    }

    get trustees(): InstanceID[] {
        const ts: InstanceID[] = [];
        for (let t = 0; t < this.trusteesBuf.length; t += 32) {
            ts.push(this.trusteesBuf.slice(t, t + 32));
        }
        return ts;
    }

    set trustees(ts: InstanceID[]) {
        const tsBuf = Buffer.alloc(ts.length * 32);
        ts.forEach((t, i) => t.copy(tsBuf, i * 32));
        this.trusteesBuf = tsBuf;
    }

    get threshold(): number {
        const tBuf = this.contact.credential.getAttribute("1-recover", "threshold");
        if (tBuf == null) {
            return 0;
        }
        return tBuf.readUInt32LE(0);
    }

    set threshold(t: number) {
        const thresholdBuf = Buffer.alloc(4);
        thresholdBuf.writeUInt32LE(t, 0);
        this.contact.credential.setAttribute("1-recover", "threshold", thresholdBuf);
        this.contact.incVersion();
    }

    findTrustee(trustee: InstanceID | Contact): number {
        if (this.trusteesBuf == null || this.trusteesBuf.length === 0) {
            return -1;
        }
        const tBuf = this.getBuffer(trustee);
        for (let t = 0; t < this.trusteesBuf.length; t += 32) {
            if (this.trusteesBuf.slice(t, t + 32).equals(tBuf)) {
                return t;
            }
        }
        return -1;
    }

    addTrustee(trustee: InstanceID | Contact) {
        if (this.findTrustee(trustee) >= 0) {
            return;
        }
        const tBuf = this.getBuffer(trustee);
        const result = Buffer.alloc(this.trusteesBuf.length + 32);
        this.trusteesBuf.copy(result);
        tBuf.copy(result, this.trusteesBuf.length);
        this.trusteesBuf = result;
    }

    rmTrustee(trustee: InstanceID | Contact) {
        const pos = this.findTrustee(trustee);
        if (pos < 0) {
            return;
        }
        const result = Buffer.alloc(this.trusteesBuf.length - 32);
        if (result.length > 0) {
            this.trusteesBuf.copy(result, 0, 0, pos * 32);
            this.trusteesBuf.copy(result, pos * 32, (pos + 1) * 32);
        }
        this.trusteesBuf = result;
    }

    getBuffer(trustee: InstanceID | Contact): Buffer {
        let tBuf: Buffer;
        if (trustee.constructor.name === "Buffer") {
            tBuf = (trustee as InstanceID);
        } else {
            tBuf = (trustee as Contact).credentialIID;
        }
        return tBuf;
    }

    toString(): string {
        return sprintf("%d: %s", this.threshold, this.trustees.map((t) => t.toString("hex")));
    }
}

class Calypso {

    /**
     * fromObject converts a stored object of Calypso into a new calypso.
     *
     * @param c an initialised contact that this calypso instance will point to
     * @param obj the object from Calypso#toObject.
     */
    static fromObject(c: Contact, obj: any): Calypso {
        const cal = new Calypso(c);
        if (obj.others) {
            Object.keys(obj.others).forEach((id) => {
                cal.others.set(Buffer.from(id, "hex"),
                    obj.others[id].map((sd) => SecureData.fromObject(sd)),
                );
            });
        }
        if (obj.ours) {
            Object.keys(obj.ours).forEach((id) =>
                cal.ours.set(id, SecureData.fromObject(obj.ours[id])));
        }
        return cal;
    }

    others: Map<InstanceID, SecureData[]>;
    ours: Map<string, SecureData>;

    constructor(public contact: Contact) {
        this.ours = new Map();
        this.others = new Map();
    }

    /**
     * toObject returns an object that is serializable and can be converted back to a
     * Calypso object. This object contains the encrypted data in clear, so it should
     * never be stored in a public space, e.g., ByzCoin.
     */
    toObject(): any {
        const obj = {
            others: {},
            ours: {},
        };
        this.ours.forEach((sd, id) => obj.ours[id] = sd.toObject());
        this.others.forEach((sds, id) => obj.others[id.toString("hex")] =
            sds.map((sd) => sd.toObject()));
        return obj;
    }

    /**
     * add creates a new calypso-write instance and stores the id in the credential of the user.
     * @param data the data to be encrypted
     * @param readers the signer-darc-ids of all the external readers
     * @return the key-string used to store this secret in the 'secret'-credential
     */
    async add(data: Buffer, readers: InstanceID[] = []): Promise<string> {
        const ourSigner = await Data.findSignerDarc(this.contact.data.bc, this.contact.credentialInstance.darcID);
        readers.unshift(ourSigner.darc.getBaseID());
        readers.forEach((r) => Log.lvl2("reader", r.toString("hex")));
        const sd = await SecureData.spawnFromSpawner(this.contact.bc, this.contact.data.lts, data, readers,
            this.contact.spawnerInstance,
            this.contact.data.coinInstance, [this.contact.data.keyIdentitySigner]);
        // Find a free number - this supposes that values are not deleted, and might give non-1-increasing
        // numbers in case a non-"value-x" is added in between.
        const atts = this.contact.credential.getCredential("1-secret");
        const count = atts ? atts.attributes.length : 0;
        const id = sprintf("value-%d", count);
        this.contact.credential.setAttribute("1-secret", id, sd.writeInstID);
        this.ours.set(id, sd);
        this.contact.incVersion();
        return id;
    }

    /**
     * read verifies if any of the contact's secret data can be read by this user.
     * @param user the remote contact to check for readable secrets
     */
    async read(user: Contact): Promise<SecureData[]> {
        const signer = await this.contact.getDarcSignIdentity();
        const sds = await SecureData.fromContact(this.contact.bc, this.contact.data.lts, user,
            signer, [this.contact.data.keyIdentitySigner],
            this.contact.data.coinInstance, [this.contact.data.keyIdentitySigner]);
        this.others.set(user.credentialIID, sds);
        this.contact.credential.setAttribute("1-secret", "others", Buffer.alloc(0));
        return sds;
    }

    /**
     * removes the object with the given keys from our secure objects. It removes all necessary
     * rules from the reader-darc, which makes sure that it cannot be evolved back to an active
     * darc.
     *
     * @param key of the object that should be deleted.
     */
    async remove(key: string) {
        const sd = this.ours.get(key);
        if (sd) {
            const wi = await CalypsoWriteInstance.fromByzcoin(this.contact.bc, sd.writeInstID);
            const di = await DarcInstance.fromByzcoin(this.contact.bc, wi.darcID);
            const nDarc = di.darc.evolve();
            nDarc.rules.removeRule(Darc.ruleSign);
            nDarc.rules.removeRule(DarcInstance.ruleEvolve);
            nDarc.rules.removeRule("spawn:" + CalypsoReadInstance.contractID);
            await di.evolveDarcAndWait(nDarc, [this.contact.data.keyIdentitySigner], 5);
            this.ours.delete(key);
            this.contact.version = this.contact.version + 1;
            this.contact.credential.delAttribute("1-secret", key);
            this.contact.incVersion();
        }
    }

    /**
     * Updates our secrets by going through the entries stored in our credential and get our data.
     */
    async fetchOurs(lts: LongTermSecret) {
        if (!this.contact.data) {
            Log.warn("called update without contact.data");
            return;
        }
        const secret = this.contact.credential.getCredential("1-secret");
        if (!secret) {
            Log.lvl2("no secrets found here");
            return;
        }
        for (const att of secret.attributes) {
            if (att.name === "others") {
                Log.lvl2("others not supported yet");
            } else {
                if (this.ours.get(att.name)) {
                    Log.lvl2(att.name, "already present");
                } else {
                    Log.lvl1("Adding", att.name, "to our secure storage");
                    try {
                        const calWrite = await CalypsoWriteInstance.fromByzcoin(this.contact.bc, att.value);
                        const signers = [this.contact.data.keyIdentitySigner];
                        const sds = await SecureData.fromWrite(this.contact.bc, lts, calWrite,
                            signers, this.contact.data.coinInstance, signers);
                        this.ours.set(att.name, sds);
                    } catch (e) {
                        Log.warn("couldn't add new data:", e);
                        // Not sure whether this should actually delete stale data or not...
                        this.contact.credential.delAttribute("1-secret", att.name);
                        this.contact.incVersion();
                        await this.contact.sendUpdate();
                    }
                }
            }
        }

        // And finally check if all `ours` are in the secret
        Array.from(this.ours.keys()).forEach((key) => {
            if (!this.contact.credential.getAttribute("1-secret", key)) {
                this.ours.delete(key);
            }
        });
    }

}
