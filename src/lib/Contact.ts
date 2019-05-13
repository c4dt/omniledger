import { CalypsoReadInstance, CalypsoWriteInstance } from "@c4dt/cothority/calypso";
import { Point, PointFactory } from "@dedis/kyber";
import { Buffer } from "buffer";
import Long from "long";
import { sprintf } from "sprintf-js";
import ByzCoinRPC from "@c4dt/cothority/byzcoin/byzcoin-rpc";
import CoinInstance from "@c4dt/cothority/byzcoin/contracts/coin-instance";
import CredentialsInstance, { CredentialStruct } from "@c4dt/cothority/byzcoin/contracts/credentials-instance";
import DarcInstance, { newDarc } from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import SpawnerInstance from "@c4dt/cothority/byzcoin/contracts/spawner-instance";
import { InstanceID } from "@c4dt/cothority/byzcoin/instance";
import { LongTermSecret } from "@c4dt/cothority/calypso";
import { IdentityDarc } from "@c4dt/cothority/darc";
import Darc from "@c4dt/cothority/darc/darc";
import IdentityEd25519 from "@c4dt/cothority/darc/identity-ed25519";
import IdentityWrapper from "@c4dt/cothority/darc/identity-wrapper";
import Rules from "@c4dt/cothority/darc/rules";
import Signer from "@c4dt/cothority/darc/signer";
import { Log } from "@c4dt/cothority/log";
import { Data, gData } from "./Data";
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

    get version(): number {
        return Contact.getVersion(this.credential);
    }

    set version(v: number) {
        Contact.setVersion(this.credential, v);
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
            this.version = this.version + 1;
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
            this.version = this.version + 1;
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
            this.version = this.version + 1;
        }
    }

    get contacts(): Contact[] {
        if (this.contactsCache) {
            return this.contactsCache;
        }
        this.contactsCache = [];
        const csBuf = this.credential.getAttribute("1-public", "contacts");
        if (csBuf) {
            const csArray: string[] = JSON.parse(csBuf.toString());
            this.contactsCache = csArray.map((c) => {
                const cont = Contact.fromObject(c);
                cont.bc = this.bc;
                return cont;
            });
        }
        return this.contactsCache;
    }

    set contacts(cs: Contact[]) {
        if (cs) {
            this.contactsCache = cs;
            const csBuf = Buffer.from(JSON.stringify(cs.map((c) => c.toObject())));
            this.credential.setAttribute("1-public", "contacts", csBuf);
            this.version = this.version + 1;
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
            this.version = this.version + 1;
        }
    }

    get seedPublic(): Public {
        return Public.fromBuffer(this.credential.getAttribute("1-public", "seedPub"));
    }

    set seedPublic(pub: Public) {
        if (pub) {
            this.credential.setAttribute("1-public", "seedPub", pub.toBuffer());
            this.version = this.version + 1;
        }
    }

    get coinID(): InstanceID {
        return this.credential.getAttribute("1-public", "coin");
    }

    set coinID(id: InstanceID) {
        if (id) {
            this.credential.setAttribute("1-public", "coin", id);
            this.version = this.version + 1;
        }
    }

    get ltsID(): InstanceID {
        return this.credential.getAttribute("1-config", "ltsID");
    }

    set ltsID(id: InstanceID) {
        if (id) {
            this.credential.setAttribute("1-config", "ltsID", id);
            this.version = this.version + 1;
        }
    }

    get ltsX(): Point {
        return PointFactory.fromProto(this.credential.getAttribute("1-config", "ltsX"));
    }

    set ltsX(X: Point) {
        if (X) {
            this.credential.setAttribute("1-config", "ltsX", X.toProto());
            this.version = this.version + 1;
        }
    }

    get spawnerID(): InstanceID {
        return this.credential.getAttribute("1-config", "spawner");
    }

    set spawnerID(id: InstanceID) {
        if (id) {
            this.credential.setAttribute("1-config", "spawner", id);
            this.version = this.version + 1;
        }
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
        const id = new IdentityEd25519({point: pubKey.toProto()});

        const darc = newDarc([id], [id], Buffer.from(`user ${alias}`));
        darc.addIdentity("invoke:coin.update", id, Rules.AND);
        darc.addIdentity("invoke:coin.fetch", id, Rules.AND);
        darc.addIdentity("invoke:coin.transfer", id, Rules.AND);
        darc.addIdentity("invoke:credential.update", id, Rules.AND);

        return darc;
    }

    static prepareInitialCred(alias: string, pub: Public, spawner: InstanceID, lts: LongTermSecret): CredentialStruct {
        const cred = new CredentialStruct();
        cred.setAttribute("1-public", "alias", Buffer.from(alias));
        cred.setAttribute("1-public", "coin", CoinInstance.coinIID(pub.toBuffer()));
        cred.setAttribute("1-public", "version", Buffer.from(Long.fromNumber(0).toBytesLE()));
        cred.setAttribute("1-public", "seedPub", pub.toBuffer());
        cred.setAttribute("1-config", "spawner", spawner);
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
        await u.connectBC(bc);
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
                return await u.update();
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
            await this.update();
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

    toObject(): object {
        return {
            calypso: this.calypso.toObject(),
            credential: this.credential.toBytes(),
        };
    }

    async update(): Promise<Contact> {
        try {
            this.contactsCache = null;
            if (this.credentialInstance == null) {
                if (this.credentialIID) {
                    this.credentialInstance = await CredentialsInstance.fromByzcoin(this.bc, this.credentialIID);
                }
            } else {
                await this.credentialInstance.update();
            }
            if (this.credentialInstance) {
                if (Contact.getVersion(this.credentialInstance.credential) > this.version) {
                    this.credential = this.credentialInstance.credential.copy();
                }

                if (this.darcInstance == null) {
                    this.darcInstance = await DarcInstance.fromByzcoin(this.bc, this.credentialInstance.darcID);
                } else {
                    await this.darcInstance.update();
                }

                if (this.coinInstance == null) {
                    const coiniid = this.getCoinAddress();
                    if (coiniid != null) {
                        this.coinInstance = await CoinInstance.fromByzcoin(this.bc, coiniid);
                    }
                } else {
                    await this.coinInstance.update();
                }
            }
            return this;
        } catch (e) {
            return Log.rcatch(e, "while updating contact", this.alias);
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

    async connectBC(bc: ByzCoinRPC) {
        Log.lvl1("Verifying user", this.alias,
            "with public key", this.seedPublic.toHex(), "and id", this.credentialIID);
        this.credentialInstance = await CredentialsInstance.fromByzcoin(bc, this.credentialIID);
        this.credential = this.credentialInstance.credential.copy();
        Log.lvl2("getting darc");
        this.darcInstance = await DarcInstance.fromByzcoin(bc, this.credentialInstance.darcID);
        Log.lvl2("getting coin");
        this.coinInstance = await CoinInstance.fromByzcoin(bc, this.coinID);
        Log.lvl2("getting spawner");
        this.spawnerInstance = await SpawnerInstance.fromByzcoin(bc, this.spawnerID);
        Log.lvl2("done for", this.alias);
        this.bc = bc;
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
        this.contact.version++;
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
        this.contact.version++;
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
     * Calypso object.
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
        readers.forEach((r) => Log.lvl2("reader", r));
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
        this.contact.version++;
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
        // const obj = this.toObject();
        // Currently just make sure that previous instances don't carry around too many MBs of
        // JSONified Buffers...
        this.contact.credential.setAttribute("1-secret", "others", Buffer.alloc(0));
        //     Buffer.from(JSON.stringify(obj.others)));
        // this.contact.version++;
        return sds;
    }

    async remove(key: string) {
        const sd = this.ours.get(key);
        if (sd) {
            const wi = await CalypsoWriteInstance.fromByzcoin(this.contact.bc, sd.writeInstID);
            const di = await DarcInstance.fromByzcoin(this.contact.bc, wi.darcID);
            const nDarc = di.darc.evolve();
            nDarc.rules.removeRule(Darc.ruleSign);
            nDarc.rules.removeRule("spawn:" + CalypsoReadInstance.contractID);
            await di.evolveDarcAndWait(nDarc, [this.contact.data.keyIdentitySigner], 5);
            this.ours.delete(key);
            this.contact.version = this.contact.version + 1;
        }
    }
}
