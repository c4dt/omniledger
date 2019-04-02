import CredentialsInstance, {CredentialStruct} from "./cothority/byzcoin/contracts/credentials-instance";
import ByzCoinRPC from "./cothority/byzcoin/byzcoin-rpc";
import {InstanceID} from "./cothority/byzcoin/instance";
import {Log} from "./Log";
import {KeyPair, Public} from "./KeyPair";
import {Buffer} from "buffer";
import SpawnerInstance from "./cothority/byzcoin/contracts/spawner-instance";
// import {parseQRCode} from ./Scan";
import {sprintf} from "sprintf-js";
// import {fromNativeSource, ImageSource} from "tns-core-modules/image-source";
// import {screen} from "tns-core-modules/platform";
import DarcInstance from "./cothority/byzcoin/contracts/darc-instance";
import CoinInstance from "./cothority/byzcoin/contracts/coin-instance";
import Signer from "./cothority/darc/signer";
import {parseQRCode} from './Scan';

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
    static readonly urlRegistered = "https://pop.dedis.ch/qrcode/identity-2";
    static readonly urlUnregistered = "https://pop.dedis.ch/qrcode/unregistered-2";
    credentialInstance: CredentialsInstance = null;
    darcInstance: DarcInstance = null;
    coinInstance: CoinInstance = null;
    recover: Recover = null;

    constructor(public credential: CredentialStruct = null, public unregisteredPub: Public = null) {
        if (credential == null) {
            this.credential = new CredentialStruct();
            Contact.setVersion(this.credential, 0);
        }
        this.recover = new Recover(this);
    }

    set version(v: number) {
        Contact.setVersion(this.credential, v);
    }

    get version(): number {
        return Contact.getVersion(this.credential);
    }

    toObject(): object {
        let o = {
            credential: this.credential.toBytes(),
            credentialIID: null,
            unregisteredPub: null,
        };
        if (this.credentialInstance) {
            o.credentialIID = this.credentialInstance.id;
        }
        if (this.unregisteredPub) {
            o.unregisteredPub = this.unregisteredPub.toBuffer();
        }
        return o;
    }

    async update(bc: ByzCoinRPC): Promise<Contact> {
        try {
            if (this.credentialInstance == null) {
                if (this.credentialIID) {
                    this.credentialInstance = await CredentialsInstance.fromByzcoin(bc, this.credentialIID);
                }
            } else {
                await this.credentialInstance.update();
            }
            if (this.credentialInstance) {
                if (Contact.getVersion(this.credentialInstance.credential) > this.version) {
                    this.credential = this.credentialInstance.credential.copy();
                }

                if (this.darcInstance == null) {
                    Log.print(1)
                    this.darcInstance = await DarcInstance.fromByzcoin(bc, this.credentialInstance.darcID);
                    Log.print(2)
                    // this.darcInstance = new DarcInstance(bc, SpawnerInstance.prepareUserDarc(this.pubIdentity, this.alias));
                } else {
                    Log.print(3)
                    await this.darcInstance.update();
                    Log.print(4)
                }

                if (this.coinInstance == null) {
                    let coiniid = this.getCoinAddress();
                    if (coiniid != null) {
                        this.coinInstance = await CoinInstance.fromByzcoin(bc, coiniid);
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
        return this.credentialIID != null && this.credentialIID.length == 32;
    }

    getCoinAddress(): InstanceID {
        if (!this.credential || !this.credential.credentials) {
            Log.error("don't have the credentials");
            return;
        }
        let coinIID = this.credential.getAttribute("coin", "coinIID");
        if (coinIID != null && coinIID.length == 32) {
            return coinIID;
        }
        return SpawnerInstance.coinIID(this.darcInstance.iid);
    }

    qrcodeIdentityStr(): string {
        let str = Contact.urlUnregistered + "?";
        if (this.isRegistered()) {
            str = sprintf("%s?credentialIID=%s&", Contact.urlRegistered, this.credentialIID.toString('hex'));
        }
        str += sprintf("public_ed25519=%s&alias=%s&email=%s&phone=%s", this.pubIdentity.toHex(), this.alias, this.email, this.phone);
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
        return this.alias == u.alias;
    }

    // this method sends the current state of the Credentials to ByzCoin.
    async sendUpdate(signer: Signer) {
        if (this.credentialInstance != null) {
            if (this.coinInstance && !this.credential.getAttribute("coin", "coinIID")) {
                this.credential.setAttribute("coin", "coinIID", this.coinInstance.id);
                this.version = this.version + 1;
            }
            if (this.version > Contact.getVersion(this.credentialInstance.credential)) {
                await this.credentialInstance.sendUpdate(signer, this.credential);
            }
        }
    }

    async addBC(bc: ByzCoinRPC, obj: any) {
        if (obj.credentialIID) {
            Log.print(1)
            this.credentialInstance = await CredentialsInstance.fromByzcoin(bc, Buffer.from(obj.credentialIID));
            this.credential = this.credentialInstance.credential.copy();
            Log.print(2)
            this.darcInstance = await DarcInstance.fromByzcoin(bc, this.credentialInstance.darcID);
            Log.print(3)
            this.coinInstance = await CoinInstance.fromByzcoin(bc, this.credentialInstance.getAttribute("coin", "coinIID"));
            Log.print(4)
        } else {
            await this.verifyRegistration(bc);
        }
    }

    async verifyRegistration(bc: ByzCoinRPC) {
        Log.lvl1("Verifying user", this.alias,
            "with public key", this.pubIdentity.toHex());
        let darcIID: InstanceID;
        if (this.darcInstance) {
            Log.lvl2("Using existing darc instance:", this.darcInstance.iid);
            let d = SpawnerInstance.prepareUserDarc(this.pubIdentity.point, this.alias);
            darcIID = this.darcInstance.iid;
        } else {
            let d = SpawnerInstance.prepareUserDarc(this.pubIdentity.point, this.alias);
            darcIID = d.getBaseID();
            Log.lvl2("Searching for darcID:", darcIID);
            // TODO: probably needs to go in a try/catch
            try {
                this.darcInstance = await DarcInstance.fromByzcoin(bc, darcIID);
            } catch (e) {
                Log.lvl2("couldn't fetch darc instance")
            }
        }

        if (!this.credentialInstance) {
            let credIID = SpawnerInstance.credentialIID(darcIID);
            Log.lvl2("Searching for credIID:", credIID);
            try {
                this.credentialInstance = await CredentialsInstance.fromByzcoin(bc, credIID);
                this.credential = this.credentialInstance.credential.copy();
            } catch (e) {
                Log.lvl2("couldn't fetch credential instance")
            }
        }
        if (this.credentialInstance) {
            this.credential.setAttribute("public", "ed25519", this.pubIdentity.toBuffer());
        }

        if (!this.coinInstance) {
            let coinIID = SpawnerInstance.coinIID(darcIID);
            try {
                this.coinInstance = await CoinInstance.fromByzcoin(bc, coinIID);
            } catch (e) {
                Log.lvl2("didn't find coinInstance");
            }
        }
    }

    toString(): string {
        return sprintf("%s (%d): %s\n%s", this.alias, this.version,
            this.credential.credentials.map(c =>
                sprintf("%s: %s", c.name, c.attributes.map(a => a.name).join("::"))).join("\n"),
            this.recover);
    }

    get credentialIID(): InstanceID {
        if (!this.credentialInstance) {
            if (!this.darcInstance) {
                return null;
            }
            return SpawnerInstance.credentialIID(this.darcInstance.iid);
        }
        return this.credentialInstance.id;
    }

    get alias(): string {
        let a = this.credential.getAttribute("personal", "alias");
        if (a) {
            return a.toString();
        }
        return "";
    }

    set alias(a: string) {
        if (a) {
            this.credential.setAttribute("personal", "alias", Buffer.from(a));
            this.version = this.version + 1;
        }
    }

    get email(): string {
        let e = this.credential.getAttribute("personal", "email");
        if (e) {
            return e.toString();
        }
        return "";
    }

    set email(e: string) {
        if (e) {
            this.credential.setAttribute("personal", "email", Buffer.from(e));
            this.version = this.version + 1;
        }
    }

    get url(): string {
        let u = this.credential.getAttribute("personal", "url");
        if (u) {
            return u.toString();
        }
        return "";
    }

    set url(u: string) {
        if (u) {
            this.credential.setAttribute("personal", "url", Buffer.from(u));
            this.version = this.version + 1;
        }
    }

    get phone(): string {
        let p = this.credential.getAttribute("personal", "phone");
        if (p) {
            return p.toString();
        }
        return "";
    }

    set phone(p: string) {
        if (p) {
            this.credential.setAttribute("personal", "phone", Buffer.from(p));
            this.version = this.version + 1;
        }
    }

    get pubIdentity(): Public {
        if (this.unregisteredPub) {
            return this.unregisteredPub;
        }
        return Public.fromBuffer(this.credential.getAttribute("public", "ed25519"))
    }

    static fromObject(obj: any): Contact {
        let u = new Contact();
        if (obj.credential) {
            u.credential = CredentialStruct.fromData(Buffer.from(obj.credential));
        }
        if (obj.unregisteredPub) {
            u.unregisteredPub = Public.fromBuffer(Buffer.from(obj.unregisteredPub));
        }
        return u;
    }

    static async fromObjectBC(bc: ByzCoinRPC, obj: any): Promise<Contact> {
        let u = Contact.fromObject(obj);
        await u.addBC(bc, obj);
        return u;
    }

    static async fromQR(bc: ByzCoinRPC, str: string): Promise<Contact> {
        let qr = await parseQRCode(str, 5);
        let u = new Contact();
        switch (qr.url) {
            case Contact.urlRegistered:
                u.credentialInstance = await CredentialsInstance.fromByzcoin(bc,
                    Buffer.from(qr.credentialIID, 'hex'));
                u.credential = u.credentialInstance.credential.copy();
                u.darcInstance = await DarcInstance.fromByzcoin(bc, u.credentialInstance.darcID);
                return await u.update(bc);
            case Contact.urlUnregistered:
                u.alias = qr.alias;
                u.email = qr.email;
                u.phone = qr.phone;
                u.unregisteredPub = Public.fromHex(qr.public_ed25519);
                return u;
            default:
                return Promise.reject("invalid URL");
        }
    }

    static async fromByzcoin(bc: ByzCoinRPC, credIID: InstanceID): Promise<Contact> {
        let u = new Contact();
        u.credentialInstance = await CredentialsInstance.fromByzcoin(bc, credIID);
        u.credential = u.credentialInstance.credential.copy();
        u.darcInstance = await DarcInstance.fromByzcoin(bc, u.credentialInstance.darcID);
        return u;
    }

    static setVersion(c: CredentialStruct, v: number) {
        let b = Buffer.alloc(4);
        b.writeUInt32LE(v, 0);
        c.setAttribute("personal", "version", b);
    }

    static getVersion(c: CredentialStruct): number {
        let b = c.getAttribute("personal", "version");
        if (b == null) {
            return 0;
        }
        return b.readUInt32LE(0);
    }

    static sortAlias(cs: hasAlias[]): hasAlias[] {
        return cs.sort((a, b) => a.alias.toLocaleLowerCase().localeCompare(b.alias.toLocaleLowerCase()));
    }
}

interface hasAlias {
    alias: string
}

class Recover {
    constructor(public contact: Contact) {
    }

    get trusteesBuf(): Buffer {
        let b = this.contact.credential.getAttribute("recover", "trustees");
        return b == null ? Buffer.alloc(0) : b;
    }

    set trusteesBuf(t: Buffer) {
        this.contact.credential.setAttribute("recover", "trustees", t);
        this.contact.version++;
    }

    get trustees(): InstanceID[] {
        let ts: InstanceID[] = [];
        for (let t = 0; t < this.trusteesBuf.length; t += 32) {
            ts.push(this.trusteesBuf.slice(t, t + 32));
        }
        return ts;
    }

    set trustees(ts: InstanceID[]) {
        let tsBuf = Buffer.alloc(ts.length * 32);
        ts.forEach((t, i) => t.copy(tsBuf, i * 32));
        this.trusteesBuf = tsBuf;
    }

    get threshold(): number {
        let tBuf = this.contact.credential.getAttribute("recover", "threshold");
        if (tBuf == null) {
            return 0;
        }
        return tBuf.readUInt32LE(0);
    }

    set threshold(t: number) {
        let thresholdBuf = Buffer.alloc(4);
        thresholdBuf.writeUInt32LE(t, 0);
        this.contact.credential.setAttribute("recover", "threshold", thresholdBuf);
        this.contact.version++;
    }

    findTrustee(trustee: InstanceID | Contact): number {
        if (this.trusteesBuf == null || this.trusteesBuf.length == 0) {
            return -1;
        }
        let tBuf = this.getBuffer(trustee);
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
        let tBuf = this.getBuffer(trustee);
        let result = Buffer.alloc(this.trusteesBuf.length + 32);
        this.trusteesBuf.copy(result);
        tBuf.copy(result, this.trusteesBuf.length);
        this.trusteesBuf = result;
    }

    rmTrustee(trustee: InstanceID | Contact) {
        let pos = this.findTrustee(trustee);
        if (pos < 0) {
            return
        }
        let result = Buffer.alloc(this.trusteesBuf.length - 32);
        if (result.length > 0) {
            this.trusteesBuf.copy(result, 0, 0, pos * 32);
            this.trusteesBuf.copy(result, pos * 32, (pos + 1) * 32);
        }
        this.trusteesBuf = result;
    }

    getBuffer(trustee: InstanceID | Contact): Buffer {
        let tBuf: Buffer;
        if (trustee.constructor.name === "Buffer") {
            tBuf = (<InstanceID>trustee);
        } else {
            tBuf = (<Contact>trustee).credentialIID;
        }
        return tBuf;
    }

    toString(): string {
        return sprintf("%d: %s", this.threshold, this.trustees.map(t => t.toString('hex')));
    }
}
