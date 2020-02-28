import ByzCoinRPC from "@dedis/cothority/byzcoin/byzcoin-rpc";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import { InstanceID } from "@dedis/cothority/byzcoin/instance";
import { CalypsoReadInstance, CalypsoWriteInstance, LongTermSecret } from "@dedis/cothority/calypso";
import { IdentityDarc, IdentityWrapper, Rule } from "@dedis/cothority/darc";
import Darc from "@dedis/cothority/darc/darc";
import IdentityEd25519 from "@dedis/cothority/darc/identity-ed25519";
import ISigner from "@dedis/cothority/darc/signer";
import Signer from "@dedis/cothority/darc/signer";
import SignerEd25519 from "@dedis/cothority/darc/signer-ed25519";
import Log from "@dedis/cothority/log";
import CredentialsInstance, { CredentialStruct } from "@dedis/cothority/personhood/credentials-instance";
import SpawnerInstance from "@dedis/cothority/personhood/spawner-instance";
import { Point, PointFactory } from "@dedis/kyber";
import { Buffer } from "buffer";
import { randomBytes } from "crypto-browserify";
import Long from "long";
import { sprintf } from "sprintf-js";
import URL from "url-parse";
import { Data, TProgress } from "./Data";
import { Public } from "./KeyPair";
import { UserLocation } from "./personhood-rpc";
import { SecureData } from "./SecureData";

const iidLen = 32;

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

    get structVersion(): number {
        const svBuf = this.credential.getAttribute("1-config", "structVersion");
        if (!svBuf || svBuf.length === 0) {
            return 0;
        }
        return svBuf.readInt32LE(0);
    }

    set structVersion(sv: number) {
        if (sv !== this.structVersion) {
            const svBuf = Buffer.alloc(4);
            svBuf.writeInt32LE(sv, 0);
            this.credential.setAttribute("1-config", "structVersion", svBuf);
            this.incVersion();
        }
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
        if (a === "") {
            throw new Error("alias cannot be empty");
        }
        if (this.alias !== a) {
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
        if (this.email !== e) {
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
        if (this.url !== u) {
            this.credential.setAttribute("1-public", "url", Buffer.from(u));
            this.incVersion();
        }
    }

    get contacts(): Contact[] {
        return this.contactsCache || [];
    }

    set contacts(cs: Contact[]) {
        this.contactsCache = cs;
        const csBuf = Buffer.concat(cs.map((c) => c.credentialIID));
        this.credential.setAttribute("1-public", "contactsBuf", csBuf);
        this.incVersion();
    }

    get phone(): string {
        const p = this.credential.getAttribute("1-public", "phone");
        if (p) {
            return p.toString();
        }
        return "";
    }

    set phone(p: string) {
        if (this.phone !== p) {
            this.credential.setAttribute("1-public", "phone", Buffer.from(p));
            this.incVersion();
        }
    }

    get seedPublic(): Public | undefined {
        const raw = this.credential.getAttribute("1-public", "seedPub");
        if (raw === undefined) {
            return undefined;
        }
        return Public.fromBuffer(raw);
    }

    set seedPublic(pub: Public) {
        if (!pub.equal(this.seedPublic)) {
            this.credential.setAttribute("1-public", "seedPub", pub.toBuffer());
            this.incVersion();
        }
    }

    get joinedChallenge(): Long {
        const longArray = this.credential.getAttribute("1-public", "challenge");
        if (longArray !== undefined) {
            return Long.fromBytesLE(Array.from(longArray));
        } else {
            return Long.fromNumber(0);
        }
    }

    set joinedChallenge(v: Long) {
        if (!this.joinedChallenge.equals(v)) {
            this.credential.setAttribute("1-public", "challenge", Buffer.from(v.toBytesLE()));
            this.incVersion();
        }
    }

    get personhoodPub(): Public | undefined {
        const raw = this.credential.getAttribute("1-public", "personhood");
        if (raw === undefined) {
            return undefined;
        }
        return Public.fromBuffer(raw);
    }

    set personhoodPub(pub: Public | undefined) {
        if (this.personhoodPub === undefined ||
            !this.personhoodPub.equal(pub)) {
            this.credential.setAttribute("1-public", "personhood", pub.toBuffer());
            this.incVersion();
        }
    }

    get coinID(): InstanceID | undefined {
        return this.credential.getAttribute("1-public", "coin");
    }

    set coinID(id: InstanceID | undefined) {
        if (this.coinID === undefined || !this.coinID.equals(id)) {
            this.credential.setAttribute("1-public", "coin", id);
            this.incVersion();
        }
    }

    get ltsID(): InstanceID | undefined {
        return this.credential.getAttribute("1-config", "ltsID");
    }

    set ltsID(id: InstanceID | undefined) {
        if (this.ltsID === undefined || !this.ltsID.equals(id)) {
            this.credential.setAttribute("1-config", "ltsID", id);
            this.incVersion();
        }
    }

    get ltsX(): Point | undefined {
        const lx = this.credential.getAttribute("1-config", "ltsX");
        return lx ? PointFactory.fromProto(lx) : undefined;
    }

    set ltsX(X: Point | undefined) {
        if (this.ltsX === undefined || !this.ltsX.equals(X)) {
            this.credential.setAttribute("1-config", "ltsX", X.toProto());
            this.incVersion();
        }
    }

    get spawnerID(): InstanceID | undefined {
        return this.credential.getAttribute("1-config", "spawner");
    }

    set spawnerID(id: InstanceID) {
        if (!id.equals(this.spawnerID)) {
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
        if (this.view !== v) {
            this.credential.setAttribute("1-config", "view", Buffer.from(v));
            this.incVersion();
        }
    }

    get subscribe(): boolean {
        const sub = this.credential.getAttribute("1-public", "subscribe");
        return sub && sub.equals(Buffer.from("true"));
    }

    set subscribe(c: boolean) {
        if (this.subscribe !== c) {
            this.credential.setAttribute("1-public", "subscribe",
                c ? Buffer.from("true") : Buffer.from("false"));
            this.incVersion();
        }
    }

    get hasSnack(): boolean {
        return this.credential.getAttribute("1-public", "snacked") !== undefined;
    }

    set hasSnack(v: boolean) {
        if (this.hasSnack !== v) {
            this.credential.setAttribute("1-public", "snacked", Buffer.alloc(iidLen));
            this.incVersion();
        }
    }

    static readonly structVersionLatest = 2;
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
        const id = IdentityEd25519.fromPoint(pubKey);

        const darc = Darc.createBasic([id], [id], Buffer.from(`user ${alias}`));
        darc.addIdentity("invoke:coin.update", id, Rule.AND);
        darc.addIdentity("invoke:coin.fetch", id, Rule.AND);
        darc.addIdentity("invoke:coin.transfer", id, Rule.AND);
        darc.addIdentity("invoke:credential.update", id, Rule.AND);

        return darc;
    }

    static prepareInitialCred(alias: string, pub: Public, spawner?: InstanceID, deviceDarcID?: InstanceID,
                              lts?: LongTermSecret): CredentialStruct {
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

    static async fromQR(bc: ByzCoinRPC, str: string): Promise<Contact> {
        const qrURL = new URL(str, true);
        const params = qrURL.query;
        const u = new Contact();
        switch (qrURL.origin + qrURL.pathname) {
            case Contact.urlRegistered:
                u.bc = bc;
                u.credentialInstance = await CredentialsInstance.fromByzcoin(bc,
                    Buffer.from(params.credentialIID, "hex"));
                u.credential = u.credentialInstance.credential.copy();
                u.darcInstance = await DarcInstance.fromByzcoin(bc, u.credentialInstance.darcID);
                return await u.updateOrConnect();
            case Contact.urlUnregistered:
                u.alias = params.alias;
                u.email = params.email;
                u.phone = params.phone;
                u.seedPublic = Public.fromHex(params.public_ed25519);
                return u;
            default:
                return Promise.reject("invalid URL");
        }
    }

    static async fromByzcoin(bc: ByzCoinRPC, credIID: InstanceID, full: boolean = true): Promise<Contact> {
        const u = new Contact();
        u.credentialInstance = await CredentialsInstance.fromByzcoin(bc, credIID);
        u.credential = u.credentialInstance.credential.copy();
        if (full) {
            u.darcInstance = await DarcInstance.fromByzcoin(bc, u.credentialInstance.darcID);
            u.coinInstance = await CoinInstance.fromByzcoin(bc, u.getCoinAddress());
        }
        u.bc = bc;
        return u;
    }

    static setVersion(c: CredentialStruct, v: number) {
        const b = Buffer.alloc(4);
        b.writeUInt32LE(v, 0);
        c.setAttribute("1-public", "version", b);
    }

    static getVersion(c: CredentialStruct): number {
        const b = c.getAttribute("1-public", "version");
        if (b === undefined) {
            return 0;
        }
        return b.readUInt32LE(0);
    }

    static sortAlias(cs: IHasAlias[]): IHasAlias[] {
        return cs.sort((a, b) => a.alias.toLocaleLowerCase().localeCompare(b.alias.toLocaleLowerCase()));
    }

    static async fromUserLocation(bc: ByzCoinRPC, ul: UserLocation): Promise<Contact> {
        try {
            const c = new Contact(ul.credential);
            if (await c.isRegisteredByzCoin(bc)) {
                c.credentialInstance = await CredentialsInstance.fromByzcoin(bc, ul.credentialIID);
                c.credential = c.credentialInstance.credential.copy();
                c.darcInstance = await DarcInstance.fromByzcoin(bc, c.credentialInstance.darcID);
            } else {
                c.seedPublic = Public.fromProto(ul.publicKey);
            }
            return c;
        } catch (e) {
            return Log.rcatch(e, "couldn't convert to Contact from UserLocation");
        }
    }
    credentialInstance: CredentialsInstance | undefined;
    darcInstance: DarcInstance | undefined;
    coinInstance: CoinInstance | undefined;
    spawnerInstance: SpawnerInstance | undefined;
    bc: ByzCoinRPC | undefined;
    contactsCache: Contact[] | undefined;
    actionsCache: DarcInstance[] | undefined;
    groupsCache: DarcInstance[] | undefined;
    recover: Recover;
    calypso: Calypso;

    constructor(public credential?: CredentialStruct,
                public data?: Data) {
        if (credential === undefined) {
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
        if (signRule === undefined) {
            throw new Error("didn't find signer darc");
        }
        const expr = signRule.getExpr().toString();
        if (expr.match(/\|&/)) {
            throw new Error("don't know what to do with a combined expression");
        }
        if (!expr.startsWith("darc:")) {
            throw new Error("signer is not a darc");
        }
        return new IdentityDarc({id: Buffer.from(expr.substr(5), "hex")});
    }

    /**
     * Returns all devices of this contact.
     */
    async getDevices(): Promise<Device[]> {
        const idID = await this.getDarcSignIdentity();
        const idDarc = await DarcInstance.fromByzcoin(this.bc, idID.id);
        const ids = idDarc.darc.rules.getRule(Darc.ruleSign).getIdentities()
            .map((id) => IdentityWrapper.fromString(id));
        return Promise.all(ids.map((id) => Device.fromByzcoin(this.bc, id.darc.id)));
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

    async getInstances(): Promise<void> {
        this.darcInstance = await DarcInstance.fromByzcoin(this.bc, this.credentialInstance.darcID, 1);
        this.coinInstance = await CoinInstance.fromByzcoin(this.bc, this.coinID, 1);
        this.spawnerInstance = await SpawnerInstance.fromByzcoin(this.bc, this.spawnerID, 1);
    }

    /**
     * If the instance is already connected to byzcoin, it will be updated with the latest data from byzcoin.
     * Else it takes a byzcoinrpc as parameters and uses it to connect to byzcoin.
     *
     * If the structure is old, it will be updated to the latest structure.
     *
     * @param bc
     * @param getContacts
     */
    async updateOrConnect(bc?: ByzCoinRPC, getContacts?: boolean): Promise<Contact | undefined> {
        if (bc !== undefined) {
            if (!(await this.isRegisteredByzCoin(bc))) {
                Log.lvl2("This user is not yet registered");
                return undefined;
            }
            this.bc = bc;
            Log.lvl1("Connecting user", this.alias,
                "with public key", this.seedPublic.toHex(), "and id", this.credentialIID.toString("hex"),
                "on chain", bc.genesisID.toString("hex"));
            this.credentialInstance = await CredentialsInstance.fromByzcoin(bc, this.credentialIID, 1);
            this.credential = this.credentialInstance.credential.copy();
            await this.getInstances();
            if (getContacts) {
                await this.getContacts();
            }
        } else {
            Log.lvl2("Updating user", this.alias);
            await this.credentialInstance.update();
            if (Contact.getVersion(this.credentialInstance.credential) > this.version) {
                this.credential = this.credentialInstance.credential.copy();
                this.contactsCache = undefined;
            }
            this.darcInstance = await DarcInstance.fromByzcoin(this.bc, this.credentialInstance.darcID);
            this.coinInstance = await CoinInstance.fromByzcoin(this.bc, this.coinID);
        }

        Log.lvl2("Updating credential version");
        for (let i = this.structVersion; i < Contact.structVersionLatest; i++) {
            switch (i) {
                case 0:
                    this.credential.setAttribute("1-devices", "initial", this.seedPublic.toBuffer());
                    break;
                case 1:
                    const csBufOld = this.credential.getAttribute("1-public", "contacts");
                    if (csBufOld !== undefined && csBufOld.length > 0) {
                        Log.lvl1("converting old contacts");
                        const csArray: string[] = JSON.parse(csBufOld.toString());
                        this.contactsCache = csArray.map((c) => Contact.fromObject(c));
                        for (const c of this.contactsCache) {
                            await c.updateOrConnect(this.bc, false);
                            await c.getInstances();
                            await c.getContacts();
                        }
                        this.credential.setAttribute("1-public", "contacts", Buffer.alloc(0));
                        this.contacts = this.contactsCache;
                    }
                    break;
            }
        }

        Log.lvl2("Updating contacts");
        if (getContacts && (!this.contactsCache || this.contactsCache.length === 0)) {
            await this.getContacts();
        }

        Log.lvl2("updateOrConnect done for", this.alias);
        return this;
    }

    async getContacts() {
        Log.lvl2("Reloading contacts of", this.alias);
        const csBuf = this.credential.getAttribute("1-public", "contactsBuf");
        this.contactsCache = [];
        if (csBuf) {
            const contactsBuf: Buffer[] = [];
            for (let c = 0; c < csBuf.length; c += iidLen) {
                contactsBuf.push(csBuf.slice(c, c + iidLen));
            }
            const cc = await Promise.all(contactsBuf.map((buf) => {
                return new Promise<Contact | undefined>(async (resolve) => {
                    try {
                        const start = new Date();
                        const cont = await Contact.fromByzcoin(this.bc, buf, false);
                        Log.lvl2(`Got contact ${cont.alias} in:`, new Date().getTime() - start.getTime());
                        resolve(cont);
                    } catch (e) {
                        Log.error("couldn't get contact - removing contact from the list");
                        resolve(undefined as Contact);
                    }
                });
            }));
            this.contactsCache = cc.filter((c) => c !== undefined);
        }
    }

    isRegistered(): boolean {
        return this.credentialInstance !== undefined;
    }

    async isRegisteredByzCoin(bc: ByzCoinRPC): Promise<boolean> {
        if (this.isRegistered()) {
            return true;
        }
        const pr = await bc.getProofFromLatest(this.credentialIID);
        return pr.exists(this.credentialIID);
    }

    getCoinAddress(): InstanceID {
        if (!this.credential || !this.credential.credentials) {
            Log.error("don't have the credentials");
            return;
        }
        if (this.coinID !== undefined && this.coinID.length === iidLen) {
            return this.coinID;
        }
        return CoinInstance.coinIID(this.seedPublic.toBuffer());
    }

    equals(u: Contact): boolean {
        if (this.credentialIID && u.credentialIID) {
            return this.credentialIID.equals(u.credentialIID);
        }
        return this.alias === u.alias;
    }

    // this method sends the current state of the Credentials to ByzCoin.
    async sendUpdate(signers?: Signer[]) {
        if (this.credentialInstance !== undefined) {
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

    toUserLocation(): UserLocation {
        return new UserLocation({
            credential: this.credential,
            credentialIID: this.credentialIID,
            location: "somewhere",
            publicKey: this.seedPublic.point.toProto(),
        });
    }

    /**
     * creates a new darc for an additional device and adjusts the signer darc to include
     * the new device with OR. This means that the new device has the same rights as all
     * the other devices.
     *
     * The returned string can be used directly to navigate to the page that offers to register
     * the new device. Registration can be done using Data.attachDevice.
     *
     * @param name the name of the new device
     * @param progress allows callbacks during creation of the device
     * @param signers defines who can attach new devices to this contact
     * @return an url that will register the user to the browser in use
     */
    async createDevice(name: string, progress?: TProgress,
                       signers: ISigner[] = [this.data.keyIdentitySigner]): Promise<string> {
        const ephemeralIdentity = SignerEd25519.fromBytes(randomBytes(iidLen));
        const dDarc = Darc.createBasic([ephemeralIdentity], [ephemeralIdentity], Buffer.from("new device"));
        if (progress) {
            progress(30, "Adding Device Darc");
        }
        const deviceDarc = (await this.spawnerInstance.spawnDarcs(this.coinInstance,
            signers, dDarc))[0];
        if (progress) {
            progress(60, "Updating Signer Darc");
        }
        await this.addSigner("1-devices", name, deviceDarc.darc.getBaseID(), signers);
        return sprintf("%s?credentialIID=%s&ephemeral=%s", Data.urlNewDevice,
            this.credentialIID.toString("hex"),
            ephemeralIdentity.secret.marshalBinary().toString("hex"));
    }

    /**
     * Removes a given device from the signerDarc, so that it cannot be used anymore
     * to do anything related to it.
     *
     * @param name of the device to remove
     * @param signers defines who can attach new devices to this contact
     */
    async deleteDevice(name: string, signers: ISigner[] = [this.data.keyIdentitySigner]): Promise<void> {
        const device = this.credential.getAttribute("1-devices", name);
        if (!device) {
            throw new Error("didn't find this device");
        }
        return this.rmSigner("1-devices", device, signers);
    }

    /**
     * addSigner takes a darc-ID and adds it to the signer-darc of this user.
     *
     * @param cred the attribute where the signer will be stored
     * @param name to store in the attribute
     * @param id the baseID of the darc used to sign
     * @param signers allowed to add a new rule to the signerDarc
     */
    async addSigner(cred: string, name: string, id: InstanceID, signers: ISigner[] = [this.data.keyIdentitySigner]) {
        const signerDarcID = this.darcInstance.getSignerDarcIDs()[0];
        const signerDarc = await DarcInstance.fromByzcoin(this.data.bc, signerDarcID);
        const newSigner = signerDarc.darc.evolve();
        const deviceDarcIdentity = new IdentityDarc({id});
        newSigner.rules.appendToRule(Darc.ruleSign, deviceDarcIdentity, Rule.OR);
        newSigner.rules.appendToRule(DarcInstance.ruleEvolve, deviceDarcIdentity, Rule.OR);
        await signerDarc.evolveDarcAndWait(newSigner, signers, 5);
        this.credential.setAttribute(cred, name, id);
        this.incVersion();
    }

    /**
     * rmSigner takes a darc-ID and removes it to the signer-darc of this user.
     *
     * @param cred the attribute where the signer will be removed
     * @param id the baseID of the darc used to sign
     * @param signers allowed to add a new rule to the signerDarc
     */
    async rmSigner(cred: string, id: InstanceID, signers: ISigner[] = [this.data.keyIdentitySigner]) {
        const signerDarcID = this.darcInstance.getSignerDarcIDs()[0];
        const signerDarc = await DarcInstance.fromByzcoin(this.data.bc, signerDarcID);
        const newSigner = signerDarc.darc.evolve();
        const idStr = new IdentityDarc({id}).toString();
        try {
            newSigner.rules.getRule(Darc.ruleSign).remove(idStr);
            newSigner.rules.getRule(DarcInstance.ruleEvolve).remove(idStr);
            await signerDarc.evolveDarcAndWait(newSigner, signers, 5);
        } catch (e) {
            if (!e.toString().match("this identity is not part of the rule")) {
                throw e;
            }
        }
        const att = this.credential.getCredential(cred).attributes.find((a) =>
            a.value.equals(id));
        this.credential.deleteAttribute(cred, att.name);
        this.incVersion();
    }
}

interface IHasAlias {
    alias: string;
}

/**
 * Represents a device from a credential. New devices can be created with
 * Contact.createDevice.
 */
class Device {

    /**
     * Fetch a new device from Byzcoin given the darcID of the signer.
     * @param rpc
     * @param darcID
     */
    static async fromByzcoin(rpc: ByzCoinRPC, darcID: InstanceID): Promise<Device> {
        const d = await DarcInstance.fromByzcoin(rpc, darcID);
        return new Device(d.darc);
    }
    readonly pubKey: Public;

    /**
     * Constructor verifies the given darc is somewhat compatible with a device.
     * @param darc
     */
    constructor(readonly darc: Darc) {
        const ids = darc.rules.getRule(Darc.ruleSign).getIdentities();
        if (ids.length > 1) {
            throw new Error("a device darc cannot have more than one signer identity");
        }
        const iw = IdentityWrapper.fromString(ids[0]);
        if (iw.ed25519 === undefined) {
            throw new Error("the signer identity in the device darc must be an ed25519");
        }
        this.pubKey = new Public(iw.ed25519.public);
    }
}

class Recover {
    constructor(public contact: Contact) {
    }

    get trusteesBuf(): Buffer {
        const t = this.contact.credential.getAttribute("1-recover", "trustees");
        if (t === undefined || t.length === 0) {
            return undefined;
        }
        return t;
    }

    set trusteesBuf(t: Buffer) {
        this.contact.credential.setAttribute("1-recover", "trustees", t);
        this.contact.incVersion();
    }

    get trustees(): InstanceID[] {
        const ts: InstanceID[] = [];
        if (this.trusteesBuf === undefined) {
            return [];
        }
        for (let t = 0; t < this.trusteesBuf.length; t += iidLen) {
            ts.push(this.trusteesBuf.slice(t, t + iidLen));
        }
        return ts;
    }

    set trustees(ts: InstanceID[]) {
        const tsBuf = Buffer.alloc(ts.length * iidLen);
        ts.forEach((t, i) => t.copy(tsBuf, i * iidLen));
        this.trusteesBuf = tsBuf;
    }

    get threshold(): number {
        const tBuf = this.contact.credential.getAttribute("1-recover", "threshold");
        if (tBuf === undefined) {
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
        const tBuf = this.getBuffer(trustee);
        return this.trustees.findIndex((t) => t.equals(tBuf));
    }

    addTrustee(trustee: InstanceID | Contact) {
        if (this.findTrustee(trustee) >= 0) {
            return;
        }
        this.trustees = this.trustees.concat(this.getBuffer(trustee));
    }

    rmTrustee(trustee: InstanceID | Contact) {
        const pos = this.findTrustee(trustee);
        if (pos < 0) {
            return;
        }
        this.trustees = this.trustees.splice(pos, 1);
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
                    obj.others[id].map((sd: any) => SecureData.fromObject(sd)),
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
            others: {} as any,
            ours: {} as any,
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
            this.contact.credential.deleteAttribute("1-secret", key);
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
                        this.contact.credential.deleteAttribute("1-secret", att.name);
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
