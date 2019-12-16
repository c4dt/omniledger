/** This is the main library for storing and getting things from the phone's file
 * system.
 */

import { Buffer } from "buffer";
import { randomBytes } from "crypto-browserify";
import Long from "long";
import { sprintf } from "sprintf-js";
import URL from "url-parse";

import ByzCoinRPC from "@dedis/cothority/byzcoin/byzcoin-rpc";
import ClientTransaction, { Argument, Instruction } from "@dedis/cothority/byzcoin/client-transaction";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import Instance, { InstanceID } from "@dedis/cothority/byzcoin/instance";
import { LongTermSecret } from "@dedis/cothority/calypso/calypso-rpc";
import { IdentityEd25519, Rule } from "@dedis/cothority/darc";
import Darc from "@dedis/cothority/darc/darc";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";
import Signer from "@dedis/cothority/darc/signer";
import ISigner from "@dedis/cothority/darc/signer";
import SignerEd25519 from "@dedis/cothority/darc/signer-ed25519";
import Log from "@dedis/cothority/log";
import CredentialInstance, {
    Attribute,
    Credential,
    CredentialStruct,
    RecoverySignature,
} from "@dedis/cothority/personhood/credentials-instance";
import { PopPartyInstance } from "@dedis/cothority/personhood/pop-party-instance";
import RoPaSciInstance from "@dedis/cothority/personhood/ro-pa-sci-instance";
import SpawnerInstance, { ICreateCost, SPAWNER_COIN } from "@dedis/cothority/personhood/spawner-instance";
import { curve, Point, Scalar, sign } from "@dedis/kyber";

import { Badge } from "./Badge";
import { Contact } from "./Contact";
import { KeyPair, Private, Public } from "./KeyPair";
import { PartyItem } from "./PartyItem";
import { PersonhoodRPC, PollStruct, RoPaSci } from "./personhood-rpc";
import { SocialNode } from "./SocialNode";
import { IStorage, StorageDB } from "./Storage";

const ed25519 = curve.newCurve("edwards25519");

/**
 * Data holds the data of the app.
 */
export class Data {

    get keyIdentitySigner(): Signer {
        return new SignerEd25519(this.keyIdentity._public.point, this.keyIdentity._private.scalar);
    }

    get darcInstance(): DarcInstance {
        return this.contact.darcInstance;
    }

    get coinInstance(): CoinInstance {
        return this.contact.coinInstance;
    }

    get credentialInstance(): CredentialInstance {
        return this.contact.credentialInstance;
    }

    get alias(): string {
        return this.contact.alias;
    }

    get spawnerInstance(): SpawnerInstance {
        return this.contact.spawnerInstance;
    }

    set spawnerInstance(si: SpawnerInstance) {
        this.contact.spawnerInstance = si;
    }

    get contacts(): Contact[] {
        return this.contact.contacts;
    }

    set contacts(cs: Contact[]) {
        this.contact.contacts = cs;
    }

    get uniqueMeetings(): number {
        const meetups = this.meetups.map((m) => Contact.sortAlias(m.users));
        const unique = meetups.filter((meetup, i) =>
            meetups.findIndex((m) => m.join() === meetup.join()) === i);
        return unique.length;
    }

    static readonly urlNewDevice = "/register/device";
    static readonly urlRecoveryRequest = "https://pop.dedis.ch/recoveryReq-1";
    static readonly urlRecoverySignature = "https://pop.dedis.ch/recoverySig-1";
    static readonly views = ["c4dt_user", "c4dt_partner", "c4dt_admin", "admin"];
    static readonly defaultStorage = "storage/data.json";

    /**
     * Returns a promise with the loaded Data in it, when available. If the file
     * is not found, it returns an empty data.
     */
    static async load(bc: ByzCoinRPC, storage: IStorage, name: string = Data.defaultStorage): Promise<Data> {
        Log.lvl1("Loading data from", name);
        const values = await storage.getObject(name);
        if (!values || values === {}) {
            throw new Error("No data available");
        }
        const d = new Data(bc, values);
        if (d.contact && await d.contact.isRegisteredByzCoin(bc)) {
            await d.connectByzcoin();
        }
        d.storage = storage;
        return d;
    }

    /**
     * createFirstUser sets up a new user with all the necessary darcs. It does the following:
     * - creates all necessary darcs (four)
     * - creates credential and coin
     * If darcID is given, it will use this darc to create all the instances. If darcID === undefined,
     * the 'SpawnerInstance'.
     *
     * @param bc an initialized ByzCoinRPC
     * @param adminDarcID id of the darc allowed to spawn darcs and credentials
     * @param adminKey private key allowed to evolve the adminDarc
     * @param alias for the new user
     * @param unrestricted whether the adminDarcID needs evolve_unrestricted
     */
    static async createFirstUser(bc: ByzCoinRPC, adminDarcID: InstanceID, adminKey: Scalar,
                                 alias: string, unrestricted: boolean = false):
        Promise<Data> {

        // Prepare adminDarc to have all necessary rules
        const adminPub = Public.base().mul(Private.fromBuffer(adminKey.marshalBinary()));
        const adminSigner = new SignerEd25519(adminPub.point, adminKey);
        const adminDarcInst = await DarcInstance.fromByzcoin(bc, adminDarcID);
        const adminRules = ["spawn:spawner", "spawn:coin", "spawn:credential", "spawn:longTermSecret",
            "spawn:calypsoWrite", "spawn:calypsoRead", "spawn:darc",
            "invoke:coin.mint", "invoke:coin.transfer", "invoke:coin.fetch"];
        if (adminRules.filter((rule) => !adminDarcInst.darc.rules.getRule(rule))) {
            const newAdminDarc = adminDarcInst.darc.evolve();
            adminRules.forEach((rule) => {
                newAdminDarc.rules.setRule(rule, adminSigner);
            });
            await adminDarcInst.evolveDarcAndWait(newAdminDarc, [adminSigner], 10, unrestricted);
        }

        const d = new Data(bc, {alias});

        const darcDevice = Darc.createBasic([d.keyIdentitySigner]
            , [d.keyIdentitySigner], Buffer.from("device"));
        const darcDeviceId = new IdentityDarc({id: darcDevice.getBaseID()});
        const darcSign = Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        const darcSignId = new IdentityDarc({id: darcSign.getBaseID()});
        const darcCred = Darc.createBasic([], [darcSignId], Buffer.from(CredentialInstance.argumentCredential),
            ["invoke:" + CredentialInstance.contractID + ".update"]);
        const rules = [CoinInstance.commandMint, CoinInstance.commandTransfer, CoinInstance.commandFetch,
            CoinInstance.commandStore].map((inv) => sprintf("invoke:%s.%s",
            CoinInstance.contractID, inv));
        const darcCoin = Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);

        Log.lvl2("Creating spawner");
        const costs: ICreateCost = {
            costCRead: Long.fromNumber(100),
            costCWrite: Long.fromNumber(1000),
            costCoin: Long.fromNumber(100),
            costCredential: Long.fromNumber(1000),
            costDarc: Long.fromNumber(100),
            costParty: Long.fromNumber(1000),
            costRoPaSci: Long.fromNumber(10),
            costValue: Long.fromNumber(10),
        };
        const spawner = await SpawnerInstance.spawn({
            bc,
            beneficiary: undefined,
            costs,
            darcID: adminDarcID,
            signers: [adminSigner],
        });

        const lts = await LongTermSecret.spawn(bc, adminDarcID, [adminSigner]);

        const cred = Contact.prepareInitialCred(alias, d.keyIdentity._public, spawner.id, darcDevice.getBaseID(), lts);

        Log.lvl1("Creating coin from darc");
        const signers = [adminSigner];
        const instructions: Instruction[] = [darcDevice, darcSign, darcCred, darcCoin].map((dar) => {
                return Instruction.createSpawn(adminDarcID, DarcInstance.contractID, [
                    new Argument({name: DarcInstance.argumentDarc, value: dar.toBytes()}),
                ]);
            },
        );
        const idBuf = d.keyIdentity._public.toBuffer();
        instructions.push(Instruction.createSpawn(adminDarcID, CoinInstance.contractID, [
            new Argument({name: CoinInstance.argumentCoinID, value: idBuf}),
            new Argument({name: CoinInstance.argumentDarcID, value: darcCoin.getBaseID()}),
            new Argument({name: CoinInstance.argumentType, value: SPAWNER_COIN}),
        ]));
        instructions.push(Instruction.createSpawn(adminDarcID, CredentialInstance.contractID, [
            new Argument({name: CredentialInstance.argumentCredID, value: idBuf}),
            new Argument({name: CredentialInstance.argumentDarcID, value: darcCred.getBaseID()}),
            new Argument({name: CredentialInstance.argumentCredential, value: cred.toBytes()}),
        ]));
        const amount = Long.fromNumber(1e9);
        instructions.push(Instruction.createInvoke(CoinInstance.coinIID(idBuf),
            CoinInstance.contractID,
            CoinInstance.commandMint,
            [new Argument({name: CoinInstance.argumentCoins, value: Buffer.from(amount.toBytesLE())})]));

        const ctx = ClientTransaction.make(bc.getProtocolVersion(), ...instructions);
        await ctx.updateCountersAndSign(bc, [signers, signers, signers, signers, signers, signers,
            [d.keyIdentitySigner]]);
        await bc.sendTransactionAndWait(ctx, 5);

        Log.lvl2("Linking new data to Data-structure");
        d.contact = new Contact(cred, d);
        Log.lvl2("Credential id should be", CredentialInstance.credentialIID(idBuf));
        await d.contact.updateOrConnect(bc);
        await d.connectByzcoin();
        Log.lvl2("done creating first user on chain", bc.genesisID.toString("hex"));
        return d;
    }

    /**
     * findSignerDarc takes a darc from a credential, coin, or writeInstance, and follows the first
     * signer. This is supposed to be the signer darc of whoever has the right to work on this
     * instance.
     *
     * @param bc a working ByzCoin instance
     * @param darcID the id of the darc that controls an instance
     */
    static async findSignerDarc(bc: ByzCoinRPC, darcID: InstanceID): Promise<DarcInstance> {
        const d = await DarcInstance.fromByzcoin(bc, darcID);
        const signer = d.getSignerDarcIDs();
        if (signer.length === 0) {
            throw new Error("Didn't find signer");
        }
        return DarcInstance.fromByzcoin(bc, signer[0]);
    }

    static async attachDevice(bc: ByzCoinRPC, urlStr: string): Promise<Data> {
        const url = new URL(urlStr, true);
        if (!url.pathname.includes(this.urlNewDevice)) {
            throw new Error("not a newDevice url");
        }
        // Remove the leading "?"
        if (!url.query.credentialIID ||
            !url.query.ephemeral) {
            throw new Error("need credentialIID and ephemeral");
        }
        const credentialIID = Buffer.from(url.query.credentialIID, "hex");
        const ephemeral = Buffer.from(url.query.ephemeral, "hex");
        if (credentialIID.length !== 32 || ephemeral.length !== 32) {
            throw new Error("either credentialIID or ephemeral is not of length 32 bytes");
        }
        const d = new Data(bc);
        d.contact = await Contact.fromByzcoin(d.bc, credentialIID);
        d.contact.data = d;
        await d.contact.updateOrConnect(d.bc);
        d.lts = new LongTermSecret(d.bc, d.contact.ltsID, d.contact.ltsX);

        // Follow the links from the credential darc-instance to the signer-darc to the device-darc
        const signerDarcID = d.contact.darcInstance.getSignerDarcIDs()[0];
        const signerDarc = await DarcInstance.fromByzcoin(d.bc, signerDarcID);
        let deviceDarc: DarcInstance;
        const ephemeralSigner = SignerEd25519.fromBytes(ephemeral);
        for (const ddID of signerDarc.getSignerDarcIDs()) {
            const dd = await DarcInstance.fromByzcoin(d.bc, ddID);
            try {
                const ids = await dd.darc.ruleMatch(Darc.ruleSign, [ephemeralSigner], () => undefined);
                if (ids.length > 0) {
                    deviceDarc = dd;
                    break;
                }
            } catch (e) {
                Log.warn("This darc doesn't match", e);
            }
        }
        if (!deviceDarc) {
            throw new Error("didn't find this ephemeral key in device darcs");
        }
        const newDeviceDarc = deviceDarc.darc.evolve();
        newDeviceDarc.rules.setRule(Darc.ruleSign, d.keyIdentitySigner);
        newDeviceDarc.rules.setRule("invoke:darc.evolve", d.keyIdentitySigner);
        await deviceDarc.evolveDarcAndWait(newDeviceDarc, [ephemeralSigner], 5);
        return d;
    }
    dataFileName: string = Data.defaultStorage;
    continuousScan: boolean;
    personhoodPublished: boolean;
    keyPersonhood: KeyPair;
    keyIdentity: KeyPair;
    lts: LongTermSecret = undefined;
    contact: Contact;
    parties: PartyItem[] = [];
    badges: Badge[] = [];
    ropascis: RoPaSciInstance[] = [];
    polls: PollStruct[] = [];
    meetups: SocialNode[] = [];
    // Non-stored fields
    recoverySignatures: RecoverySignature[] = [];
    storage: IStorage = StorageDB;
    references: string[] = [];
    phrpc: PersonhoodRPC;

    /**
     * Constructs a new Data, optionally initialized with an object containing
     * fields for initialization of the class.
     * @param bc an initialized ByzCoinRPC class that references a working ByzCoin
     * @param obj (optional) object with all fields for the class.
     */
    constructor(
        readonly bc: ByzCoinRPC,
        obj: any = {},
    ) {
        this.setValues(obj);
    }

    setFileName(n: string) {
        this.dataFileName = `storage/${n}`;
    }

    setValues(obj: any) {
        this.continuousScan = obj.continuousScan ? obj.continuousScan : false;
        this.personhoodPublished = obj.personhoodPublished ? obj.personhoodPublished : false;
        this.keyPersonhood = obj.keyPersonhood ? new KeyPair(obj.keyPersonhood) : new KeyPair();
        this.keyIdentity = obj.keyIdentity ? new KeyPair(obj.keyIdentity) : new KeyPair();
        this.meetups = obj.meetups ? obj.meetups.map((m: any) => SocialNode.fromObject(m)) : [];
        this.parties = obj.parties ? obj.parties.map((p: any) => PartyItem.fromObject(this.bc, p)) : [];

        if (obj.badges) {
            this.badges = obj.badges.map((b: any) => Badge.fromObject(this.bc, b));
            this.badges = this.badges.filter((badge, i) =>
                this.badges.findIndex((b) => b.party.uniqueName === badge.party.uniqueName) === i);
        } else {
            this.badges = [];
        }

        if (obj.version !== undefined && obj.version >= 1) {
            // Initialize RoPaSciInstance, even if bc === undefined. It will be set later.
            this.ropascis = obj.ropascis ? obj.ropascis.map((rps: any) =>
                RoPaSciInstance.fromObject(this.bc, rps)) : [];
        } else {
            this.ropascis = obj.ropascis ? obj.ropascis.map((rps: any) =>
                new RoPaSciInstance(this.bc, Instance.fromBytes(Buffer.from(rps)))) : [];
        }

        this.polls = obj.polls ? obj.polls.map((rps: any) => PollStruct.fromObject(rps)) : [];

        if (obj.contact !== undefined) {
            this.contact = Contact.fromObject(obj.contact);
            this.contact.data = this;
        } else {
            const cred = Contact.prepareInitialCred("new identity", this.keyIdentity._public);
            this.contact = new Contact(cred, this);
        }
        this.references = ("references" in obj) ? obj.references : [];
    }

    async connectByzcoin(): Promise<ByzCoinRPC> {
        Log.lvl2("Getting contact informations");
        this.contact.data = this;
        await this.contact.updateOrConnect(this.bc, true);
        this.lts = new LongTermSecret(this.bc, this.contact.ltsID, this.contact.ltsX);
        this.ropascis = this.ropascis.map((rps) => RoPaSciInstance.fromObject(this.bc, rps.toObject()));
        return this.bc;
    }

    toObject(): any {
        const v = {
            badges: [] as any,
            bcID: undefined as any,
            bcRoster: undefined as any,
            coinInstance: undefined as any,
            contact: this.contact.toObject(),
            continuousScan: this.continuousScan,
            credentialInstance: undefined as any,
            darcInstance: undefined as any,
            keyIdentity: this.keyIdentity._private.toHex(),
            keyPersonhood: this.keyPersonhood._private.toHex(),
            meetups: this.meetups.map((m) => m.toObject()),
            parties: [] as any,
            personhoodPublished: this.personhoodPublished,
            polls: [] as any,
            references: this.references,
            ropascis: [] as any,
            version: 1,
        };
        if (this.bc) {
            v.bcRoster = this.bc.getConfig().roster.toJSON();
            v.bcID = this.bc.getGenesis().computeHash();
            v.parties = this.parties ? this.parties.map((p) => p.toObject()) : undefined;
            v.badges = this.badges ? this.badges.map((b) => b.toObject()) : undefined;
            v.ropascis = this.ropascis ? this.ropascis.map((rps) => rps.toObject()) : undefined;
            v.polls = this.polls ? this.polls.map((pollStruct) => {
                return Buffer.from(PollStruct.encode(pollStruct).finish());
            }) : undefined;
        }
        return v;
    }

    async publishPersonhood(publish: boolean) {
        this.personhoodPublished = publish;
        if (publish) {
            try {
                Log.lvl2("Personhood not yet stored - adding to credential");
                this.contact.personhoodPub = this.keyPersonhood._public;
                await this.contact.sendUpdate();
            } catch (e) {
                Log.catch(e);
            }
        }
    }

    async isAvailableInStorage(): Promise<boolean> {
        return (await this.storage.getObject(this.dataFileName)) !== undefined;
    }

    async save(): Promise<Data> {
        Log.lvl1("Saving data to", this.dataFileName);
        if (this.personhoodPublished) {
            this.contact.personhoodPub = this.keyPersonhood._public;
        }
        if (this.contact.isRegistered()) {
            Log.lvl2("Sending update to chain");
            await this.contact.sendUpdate();
        }
        await this.storage.putObject(this.dataFileName, this.toObject());
        return this;
    }

    async canPay(amount: Long): Promise<boolean> {
        if (!(this.coinInstance && this.spawnerInstance)) {
            throw new Error("Cannot sign up a contact without coins and spawner");
        }
        if (amount.lessThanOrEqual(0)) {
            throw new Error("Cannot send 0 or less coins");
        }
        if (amount.greaterThanOrEqual(this.coinInstance.value)) {
            throw new Error("You only have " + this.coinInstance.value.toString() + " coins.");
        }
        return true;
    }

    dummyProgress(percentage: number = 0, text: string = "") {
        Log.lvl2("Dummyprogress:", percentage, text);
    }

    async registerContact(contact: Contact, balance: Long = Long.fromNumber(0),
                          storage: IStorage = this.storage,
                          progress: TProgress = this.dummyProgress): Promise<any> {
        try {
            const d = new Data(this.bc);
            d.storage = storage;
            d.contact = contact;
            d.contact.credential = Contact.prepareInitialCred(
                contact.alias, contact.seedPublic, this.spawnerInstance.id, undefined, this.lts);
            d.spawnerInstance = this.spawnerInstance;
            progress(50, "Writing credential to chain");
            await d.registerSelf(this.coinInstance, [this.keyIdentitySigner]);
            progress(100, "Done");
        } catch (e) {
            Log.catch(e);
            progress(-100, "Error: " + e.toString());
            throw new Error(e);
        }
    }

    async createUserCredentials(pub: Public = this.keyIdentity._public,
                                darcID: Buffer = this.darcInstance.id,
                                coinIID: Buffer = this.coinInstance.id,
                                referral?: Buffer,
                                orig?: Contact): Promise<CredentialInstance> {
        let cred: CredentialStruct;
        if (orig === undefined) {
            Log.lvl1("Creating user credential");
            const credPub = Credential.fromNameAttr("public", "ed25519", pub.toBuffer());
            const credDarc = Credential.fromNameAttr("darc", "darcID", darcID);
            const credCoin = Credential.fromNameAttr("coin", "coinIID", coinIID);
            cred = new CredentialStruct({credentials: [credPub, credDarc, credCoin]});
        } else {
            cred = orig.credential.copy();
        }
        if (referral) {
            cred.credentials[0].attributes.push(new Attribute({name: "referred", value: referral}));
        }
        return await this.spawnerInstance.spawnCredential(this.coinInstance, [this.keyIdentitySigner], darcID,
            cred, pub.toBuffer());
    }

    async verifyRegistration() {
        if (this.bc === undefined) {
            throw new Error("cannot verify if no byzCoin connection is set");
        }
        await this.contact.updateOrConnect(this.bc);
    }

    // setTrustees stores the given contacts in the credential, so that a threshold of these contacts
    // can recover the darc. Only one set of contacts for recovery can be stored.
    setTrustees(threshold: number, cs: Contact[]) {
        if (cs.filter((c) => c.isRegistered()).length !== cs.length) {
            throw new Error("not all contacts are registered");
        }
        const recoverBuf = Buffer.alloc(32 * cs.length);
        cs.forEach((c, i) =>
            cs[i].credentialIID.copy(recoverBuf, i * 32, 0, 32));
        this.contact.recover.trusteesBuf = recoverBuf;
        this.contact.recover.threshold = threshold;
    }

    // searchRecovery searches all contacts to know if this user is in the list of recovery possibilities.
    // It also updates all contacts by getting proofs from byzcoin.
    async searchRecovery(): Promise<Contact[]> {
        const recoveries: Contact[] = [];
        for (const contact of this.contacts) {
            await contact.updateOrConnect();
            if (contact.recover.trustees.filter((t) =>
                t.equals(this.contact.credentialIID)).length > 0) {
                recoveries.push(contact);
            }
        }
        return recoveries;
    }

    // recoveryRequest returns a string for a qrcode that holds the new public key of the new user.
    recoveryRequest(): string {
        return sprintf("%s?public=%s", Data.urlRecoveryRequest, this.keyIdentity._public.toHex());
    }

    // RecoverySignature returns a string for a qrcode that holds the signature to be used to proof that this
    // trustee is OK with recovering a given account.
    async recoverySignature(request: string, user: Contact): Promise<string> {
        const requestURL = new URL(request, true);
        if (requestURL.origin + requestURL.pathname !== Data.urlRecoveryRequest) {
            throw new Error("not a recovery request");
        }
        if (!requestURL.query.public) {
            throw new Error("recovery request is missing public argument");
        }
        const publicKey = Buffer.from(requestURL.query.public, "hex");
        if (publicKey.length !== RecoverySignature.pub) {
            throw new Error("got wrong public key length");
        }

        await user.updateOrConnect();

        // the message to be signed is:
        // credentialIID + newPublicKey + latestDarcVersion
        const msg = Buffer.alloc(RecoverySignature.msgBuf);
        user.credentialIID.copy(msg);
        publicKey.copy(msg, RecoverySignature.credIID);
        msg.writeUInt32LE(user.darcInstance.darc.version.toNumber(), RecoverySignature.credIID + RecoverySignature.pub);

        const sig = sign.schnorr.sign(ed25519, this.keyIdentity._private.scalar, msg);
        const sigBuf = Buffer.alloc(RecoverySignature.pubSig);
        this.keyIdentity._public.toBuffer().copy(sigBuf);
        Buffer.from(sig).copy(sigBuf, RecoverySignature.pub);

        return sprintf("%s?credentialIID=%s&pubSig=%s", Data.urlRecoverySignature,
            user.credentialIID.toString("hex"),
            sigBuf.toString("hex"));
    }

    /**
     * recoveryStore stores a signature for restauration. It checks if all the signature are for
     * restauration of the same credentialIID.
     *
     * @param signature the qrcode-string received from scanning.
     */
    async recoveryStore(signature: string) {
        const sigURL = new URL(signature, true);
        if (sigURL.origin + sigURL.pathname !== Data.urlRecoverySignature) {
            throw new Error("not a recovery signature");
        }
        const sigParams = sigURL.query;
        if (!sigParams.credentialIID ||
            !sigParams.pubSig) {
            throw new Error("credentialIID or signature missing");
        }
        const credIID = Buffer.from(sigParams.credentialIID, "hex");
        const pubSig = Buffer.from(sigParams.pubSig, "hex");
        if (pubSig.length !== RecoverySignature.pubSig) {
            throw new Error("signature should be of length 64");
        }

        if (this.recoverySignatures.length > 0) {
            if (!this.recoverySignatures[0].credentialIID.equals(credIID)) {
                this.recoverySignatures = [];
            }
        }
        this.recoverySignatures.push(new RecoverySignature(credIID, pubSig));
    }

    // recoveryUser returns the user that is currently being recovered.
    async recoveryUser(): Promise<Contact> {
        if (this.recoverySignatures.length === 0) {
            throw new Error("don't have any recovery signatures stored yet.");
        }
        return Contact.fromByzcoin(this.bc, this.recoverySignatures[0].credentialIID);
    }

    // recoverIdentity sends all received signatures to the credential instance, thus evolving the
    // darc to include our new public key.
    async recoverIdentity(): Promise<any> {
        this.contact = await this.recoveryUser();
        await this.contact.credentialInstance.recoverIdentity(this.keyIdentity._public.point, this.recoverySignatures);
        this.recoverySignatures = [];
        await this.contact.darcInstance.update();
        const newD = this.contact.darcInstance.darc.copy();
        ["update", CoinInstance.commandFetch, CoinInstance.commandTransfer].forEach((r) => {
            newD.rules.appendToRule("invoke:" + r, this.keyIdentitySigner, "&");
        });
        await this.contact.darcInstance.evolveDarcAndWait(newD, [this.keyIdentitySigner], 5);
        await this.verifyRegistration();
    }

    addContact(nu: Contact) {
        this.rmContact(nu);
        // Cannot use push on setters and getters
        this.contacts = this.contacts.concat(nu);
    }

    rmContact(nu: Contact) {
        this.contacts = this.contacts.filter((u) => !u.equals(nu));
    }

    async updateParties(): Promise<PartyItem[]> {
        await Promise.all(this.parties.map(async (p) => p.partyInstance.update()));
        // Move all finalized parties into badges
        const parties: PartyItem[] = [];
        this.parties.forEach((p) => {
            if (p.state === PartyItem.finalized) {
                if (p.partyInstance.popPartyStruct.attendees.keys.find((k) =>
                    k.equals(this.keyPersonhood._public.point.toProto()))) {
                    this.badges.push(new Badge(p, this.keyPersonhood));
                    Log.lvl2("added party to our badges");
                } else {
                    Log.lvl2("removing party that doesn't have our key stored");
                }
            } else {
                parties.push(p);
            }
        });
        this.parties = parties;
        await this.save();
        return this.parties;
    }

    async reloadParties(): Promise<PartyItem[]> {
        const phParties = await this.phrpc.listParties();
        await Promise.all(phParties.map(async (php) => {
            Log.lvl2("Searching party", php.instanceID);
            if (this.parties.find((p) => p.partyInstance.id.equals(php.instanceID)) === undefined) {
                Log.lvl2("Found new party id", php.instanceID, this.bc.genesisID);
                const ppi = await PopPartyInstance.fromByzcoin(this.bc, php.instanceID);
                Log.lvl2("Found new party", ppi.popPartyStruct.description.name);
                const p = new PartyItem(ppi);
                try {
                    const orgKeys = await this.fetchOrgKeys(ppi);
                    p.isOrganizer = !!orgKeys.find((k) => k.equals(this.keyPersonhood._public.point));
                } catch (e) {
                    Log.info("One or more of the organizers are not known");
                }
                this.parties.push(p);
            }
        }));
        Log.lvl2("finished with searching");
        await this.save();
        return this.parties;
    }

    async fetchOrgKeys(ppi: PopPartyInstance): Promise<Point[]> {
        const piDarc = await DarcInstance.fromByzcoin(this.bc, ppi.darcID);
        const orgDarcs = piDarc.darc.rules.list.find((l) => l.action === "invoke:popParty.finalize").getIdentities();
        const orgPers: Point[] = [];
        const contacts = [this.contact].concat(this.contacts);

        for (const orgDarc of orgDarcs) {
            // Remove leading "darc:" from expression
            const orgDarcID = Buffer.from(orgDarc.substr(5), "hex");
            const contact = contacts.find((c) => c.credentialInstance.darcID.equals(orgDarcID));
            if (contact === undefined) {
                throw new Error("didn't find organizer in contacts");
            }
            const pub = contact.personhoodPub;
            if (!pub) {
                throw new Error("found organizer without personhood credential");
            }

            orgPers.push(pub.point);
        }

        return orgPers;
    }

    async addParty(p: PartyItem) {
        this.parties.push(p);
        await this.phrpc.listParties(p.toParty(this.bc));
        await this.save();
    }

    async reloadRoPaScis(): Promise<RoPaSciInstance[]> {
        this.ropascis = this.ropascis.filter((ropasci: RoPaSciInstance) =>
            ropasci.isDone() ||
            ropasci.ourGame(this.coinInstance.id) ||
            ropasci.struct.secondPlayer >= 0,
        );
        const phRoPaScis = await this.phrpc.listRPS();
        await Promise.all(phRoPaScis.map(async (rps) => {
            if (this.ropascis.find((r) => r.id.equals(rps.roPaSciID)) === undefined) {
                Log.lvl2("Found new ropasci");
                try {
                    const rpsInst = await RoPaSciInstance.fromByzcoin(this.bc, rps.roPaSciID);
                    Log.lvl2("RoPaSciInstance is:", rpsInst.struct.description, rpsInst.struct.firstPlayer,
                        rpsInst.struct.secondPlayer);
                    this.ropascis.push(rpsInst);
                } catch (e) {
                    Log.catch(e, "while fetching new ropasci");
                }
            }
        }));
        Log.lvl2("finished with searching");
        return this.ropascis;
    }

    async updateRoPaScis(): Promise<RoPaSciInstance[]> {
        await Promise.all(this.ropascis
            .filter((rps) => rps.struct.firstPlayer < 0)
            .map(async (rps) => rps.update()));
        return this.ropascis;
    }

    async addRoPaSci(rps: RoPaSciInstance) {
        this.ropascis.push(rps);
        await this.save();
        await this.phrpc.listRPS(new RoPaSci({
            byzcoinID: this.bc.genesisID,
            roPaSciID: rps.id,
        }));
    }

    async delRoPaSci(rps: RoPaSciInstance) {
        const i = this.ropascis.findIndex((r) => r.id.equals(rps.id));
        if (i >= 0) {
            this.ropascis.splice(i, 1);
        }
        await this.save();
    }

    async reloadPolls(): Promise<PollStruct[]> {
        this.polls = await this.phrpc.pollList(this.badges.map((b) => b.party.partyInstance.id));
        return this.polls;
    }

    async addPoll(personhood: InstanceID, title: string, description: string, choices: string[]): Promise<PollStruct> {
        const rps = await this.phrpc.pollNew(personhood, title, description, choices);
        this.polls.push(rps);
        await this.save();
        return rps;
    }

    async delPoll(rps: PollStruct) {
        const i = this.polls.findIndex((r) => r.pollID.equals(rps.pollID));
        if (i >= 0) {
            this.polls.splice(i, 1);
            await this.save();
        }
    }

    // createUser sets up a new user with all the necessary darcs. It does the following:
    // - creates all necessary darcs (four)
    // - creates credential and coin
    // The user needs to have enough coins to pay for all the instances when using
    // the 'SpawnerInstance'.
    async createUser(alias: string, ephemeral?: Private, storage: IStorage = this.storage): Promise<Data> {
        Log.lvl1("Starting to create user", alias);
        const d = new Data(this.bc);
        d.storage = storage;

        if (!ephemeral) {
            d.keyIdentity = new KeyPair();
        } else {
            d.keyIdentity = new KeyPair(ephemeral.toHex());
        }
        d.contact.credential = Contact.prepareInitialCred(alias, d.keyIdentity._public, this.spawnerInstance.id,
            undefined, this.lts);
        d.spawnerInstance = this.spawnerInstance;
        return d.registerSelf(this.coinInstance, [this.keyIdentitySigner]);
    }

    // registerUser stores this data in ByzCoin. It uses the given coin to pay
    // for all the instances.
    async registerSelf(coin: CoinInstance, signers: [ISigner]): Promise<Data> {
        const pub = this.contact.seedPublic.point;
        const iident = [IdentityEd25519.fromPoint(pub)];
        const darcDevice = Darc.createBasic(iident, iident, Buffer.from("device"));
        const darcDeviceId = new IdentityDarc({id: darcDevice.getBaseID()});
        const darcSign = Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        const darcSignId = new IdentityDarc({id: darcSign.getBaseID()});
        const darcCred = Darc.createBasic([], [darcSignId], Buffer.from("credential"),
            ["invoke:" + CredentialInstance.contractID + ".update"]);
        const rules = [CoinInstance.commandTransfer, CoinInstance.commandFetch,
            CoinInstance.commandStore].map((inv) => sprintf("invoke:%s.%s", CoinInstance.contractID, inv));
        const darcCoin = Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);

        this.contact.credential.setAttribute("1-devices", "initial", darcDevice.getBaseID());

        Log.lvl1("Creating identity from spawner");
        const ctx = ClientTransaction.make(this.bc.getProtocolVersion(),
            ...this.spawnerInstance.spawnDarcInstructions(coin,
                darcDevice, darcSign, darcCred, darcCoin),
            ...this.spawnerInstance.spawnCoinInstructions(coin,
                darcCoin.getBaseID(), pub.marshalBinary()),
            ...this.spawnerInstance.spawnCredentialInstruction(coin,
                darcCred.getBaseID(), this.contact.credential, pub.marshalBinary()),
        );
        await ctx.updateCountersAndSign(this.bc, [signers]);
        await this.bc.sendTransactionAndWait(ctx);

        Log.lvl2("updating contact");
        await this.contact.updateOrConnect(this.bc);
        Log.lvl2("finalizing data");
        await this.connectByzcoin();
        return this;
    }

    /**
     * Returns the coins needed to create a new user
     */
    signupCost(): Long {
        const c = this.spawnerInstance.costs;
        return c.costCoin.value.mul(4).add(
            c.costCredential.value).add(
            c.costCoin.value);
    }

    /**
     * Attaches to an existing darc using an ephemeral private key. As soon as the darc
     * is found, a new random key is generated and used to replace the ephemeral key.
     *
     * @param ephemeral the private key that is used to calculate the public key and
     * the credentialIID.
     */
    async attachAndEvolve(ephemeral: Private): Promise<void> {
        const pub = Public.base().mul(ephemeral);
        this.contact = await Contact.fromByzcoin(this.bc, CredentialInstance.credentialIID(pub.toBuffer()));
        this.contact.data = this;
        await this.contact.updateOrConnect(this.bc);
        this.lts = new LongTermSecret(this.bc, this.contact.ltsID, this.contact.ltsX);
        // Follow the links from the credential darc-instance to the signer-darc to the device-darc
        const signerDarcID = this.contact.darcInstance.getSignerDarcIDs()[0];
        const signerDarc = await DarcInstance.fromByzcoin(this.bc, signerDarcID);
        const deviceDarcID = signerDarc.getSignerDarcIDs()[0];
        const deviceDarc = await DarcInstance.fromByzcoin(this.bc, deviceDarcID);
        const newDeviceDarc = deviceDarc.darc.evolve();
        newDeviceDarc.rules.setRule(Darc.ruleSign, this.keyIdentitySigner);
        newDeviceDarc.rules.setRule("invoke:darc.evolve", this.keyIdentitySigner);
        const signer = new SignerEd25519(pub.point, ephemeral.scalar);
        await deviceDarc.evolveDarcAndWait(newDeviceDarc, [signer], 5);
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
     */
    async createDevice(name: string): Promise<URL> {
        const ephemeralIdentity = SignerEd25519.fromBytes(randomBytes(32));
        const signerDarcID = this.contact.darcInstance.getSignerDarcIDs()[0];
        const signerDarc = await DarcInstance.fromByzcoin(this.bc, signerDarcID);
        const dDarc = Darc.createBasic([ephemeralIdentity], [ephemeralIdentity], Buffer.from(name));
        const deviceDarc = (await this.spawnerInstance.spawnDarcs(this.coinInstance, [this.keyIdentitySigner],
            dDarc))[0];
        const deviceDarcIdentity = new IdentityDarc({id: deviceDarc.darc.getBaseID()});
        const newSigner = signerDarc.darc.evolve();
        newSigner.rules.appendToRule(Darc.ruleSign, deviceDarcIdentity, Rule.OR);
        const re = DarcInstance.ruleEvolve;
        newSigner.rules.appendToRule(re, deviceDarcIdentity, Rule.OR);
        await signerDarc.evolveDarcAndWait(newSigner, [this.keyIdentitySigner], 5);
        this.contact.credential.setAttribute("1-devices", name, deviceDarc.darc.getBaseID());
        this.contact.incVersion();
        await this.contact.sendUpdate();
        return new URL(sprintf("%s?credentialIID=%s&ephemeral=%s", Data.urlNewDevice,
            this.contact.credentialIID.toString("hex"),
            ephemeralIdentity.secret.marshalBinary().toString("hex")));
    }

    /**
     * Removes a given device from the signerDarc, so that it cannot be used anymore
     * to do anything related to it.
     *
     * @param name of the device to remove
     */
    async deleteDevice(name: string): Promise<void> {
        const device = this.contact.credential.getAttribute("1-devices", name);
        if (device === undefined) {
            throw new Error(`didn't find device "${name}"`);
        }
        const signerDarcID = this.contact.darcInstance.getSignerDarcIDs()[0];
        const signerDarc = await DarcInstance.fromByzcoin(this.bc, signerDarcID);
        const newSigner = signerDarc.darc.evolve();
        const deviceStr = `darc:${device.toString("hex")}`;
        newSigner.rules.getRule(Darc.ruleSign).remove(deviceStr);
        newSigner.rules.getRule(DarcInstance.ruleEvolve).remove(deviceStr);
        await signerDarc.evolveDarcAndWait(newSigner, [this.keyIdentitySigner], 5);
        this.contact.credential.deleteAttribute("1-devices", name);
        this.contact.incVersion();
        await this.contact.sendUpdate();
    }
}

// Progress type to be used in showTransactions.
export type TProgress = (percentage: number, text: string) => void;
