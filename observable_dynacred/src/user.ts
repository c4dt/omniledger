import URL from "url-parse";
import {Log} from "@dedis/cothority";
import {CredentialStructBS, EAttributesPublic, ECredentials,} from "./credentialStructBS";
import {AddressBook} from "./addressBook";
import {ByzCoinRPC, Instance, InstanceID} from "@dedis/cothority/byzcoin";
import {CredentialsInstance, CredentialStruct, SpawnerInstance} from "@dedis/cothority/byzcoin/contracts";
import {KeyPair} from "./keypair";
import {CoinBS} from "./coinBS";
import {CredentialSignerBS} from "./signers";
import {Darc, IdentityDarc, IdentityWrapper, SignerEd25519} from "@dedis/cothority/darc";
import {Transaction} from "./transaction";
import {IDataBase} from "./interfaces";
import {Instances, newIInstance} from "./instances";
import {BehaviorSubject} from "rxjs";
import {ObservableToBS} from "./observableHO";
import {catchError, flatMap, map, mergeAll} from "rxjs/operators";
import {UserSkeleton} from "./userSkeleton";
import {Genesis, ICoin} from "./genesis";
import {Scalar} from "@dedis/kyber/index";
import Long from "long";

export interface IMigrate {
    keyPersonhood?: string;
    keyIdentity: string;
    version: number;
    contact: IMigrateContact;
}

export interface IMigrateContact {
    credential: Buffer;
}

export class BasicStuff {
    constructor(
        public bc: ByzCoinRPC,
        public db: IDataBase,
        public inst: Instances
    ) {
    }
}

export class IUser extends BasicStuff {
    public kpp: KeyPair;
    public dbBase: string;
    public credStructBS: CredentialStructBS;
    public spawnerInstanceBS: BehaviorSubject<SpawnerInstance>;
    public coinBS: CoinBS;
    public credSignerBS: CredentialSignerBS;
    public addressBook: AddressBook;
}

// The user class is to be used only once for a given DB. It is unique for
// one URL-domain and represents the logged in user.
// When calling `User.load`, it tries to migrate from a previous dynacred
// installation.
// If the migration is successful, it uses this configuration, stores the
// new information and deletes the old config.
export class User extends IUser {
    static readonly urlNewDevice = "/register/device";
    public static readonly keyPriv = "private";
    public static readonly keyCredID = "credID";
    public static readonly keyMigrate = "storage/data.json";
    public static readonly versionMigrate = 1;
    public static migrateOnce = false;

    constructor(u: IUser) {
        super(u.bc, u.db, u.inst);
        Object.keys(u).forEach(k => this[k] = u[k]);
    }

    get kiSigner(): SignerEd25519 {
        return this.kpp.signer();
    }

    get identityDarcSigner(): IdentityDarc {
        return new IdentityDarc({id: this.credSignerBS.getValue().getBaseID()});
    }

    public static async getUser(bs: BasicStuff, credID: InstanceID, privBuf: Buffer,
                                dbBase = "main"): Promise<User> {
        Log.lvl3("getting credential struct BS");
        const credStructBS = await CredentialStructBS.getCredentialStructBS(bs, credID);
        const kpp = KeyPair.fromPrivate(privBuf);
        const auth = await bs.bc.checkAuthorization(bs.bc.genesisID, credStructBS.darcID,
            IdentityWrapper.fromIdentity(kpp.signer()));
        Log.print("Got authorization", auth);
        Log.lvl3("getting credentialSignerBS");
        const credSignerBS = await CredentialSignerBS.getCredentialSignerBS(bs, credStructBS);
        const spawnerInstanceBS = await ObservableToBS(credStructBS.credConfig.spawnerID.pipe(
            flatMap(id => bs.inst.instanceBS(id)),
            catchError(err => {
                Log.error(err);
                return Promise.resolve(new BehaviorSubject(
                    newIInstance(Buffer.alloc(32), Buffer.alloc(0), SpawnerInstance.contractID)));
            }),
            mergeAll(),
            map(inst => Buffer.from(JSON.stringify({
                contractID: inst.contractID, darcID: inst.darcID,
                data: inst.value, id: inst.key
            }))),
            map(instBuf => new SpawnerInstance(bs.bc, Instance.fromBytes(instBuf)))
        ));
        Log.lvl3("getting coinBS");
        const coinBS = await CoinBS.getCoinBS(bs, credStructBS.credPublic.coinID);
        Log.lvl3("getting address book");
        const addressBook = await AddressBook.getAddressBook(bs, credStructBS.credPublic);
        const user = new User({
            bc: bs.bc, db: bs.db, inst: bs.inst,
            kpp, dbBase, credStructBS, spawnerInstanceBS, coinBS, credSignerBS, addressBook
        });
        await user.save();
        return user;
    }


    public static async createUser(genesis: Genesis, alias = "1st user", priv?: Scalar, dbBase = "main"): Promise<User> {
        if (!priv) {
            priv = KeyPair.rand().priv;
        }
        const userFactory = new UserSkeleton(alias, genesis.spawner.id, priv);
        const tx = new Transaction(genesis.bs.bc, genesis.spawner, genesis.coin);
        tx.createUser(userFactory, Long.fromNumber(1e6));
        await tx.send(2);
        return User.getUser(genesis.bs, userFactory.credID, userFactory.keyPair.priv.marshalBinary(), dbBase);
    }

    public static async attachAndEvolve(bs: BasicStuff, ephemeral: KeyPair): Promise<User> {
        const credID = CredentialsInstance.credentialIID(ephemeral.pub.marshalBinary());
        return this.switchKey(bs, credID, ephemeral);
    }

    public static async attachAndEvolveDevice(bs: BasicStuff, urlStr: string): Promise<User> {
        const url = new URL(urlStr);
        if (!url.pathname.includes(this.urlNewDevice)) {
            throw new Error("not a newDevice url");
        }
        if (!url.query.credentialIID ||
            !url.query.ephemeral) {
            throw new Error("need credentialIID and ephemeral");
        }
        const credID = Buffer.from(url.query.credentialIID, "hex");
        const ephemeralBuf = Buffer.from(url.query.ephemeral, "hex");
        if (credID.length !== 32 || ephemeralBuf.length !== 32) {
            throw new Error("either credentialIID or ephemeral is not of length 32 bytes");
        }

        return this.switchKey(bs, credID, KeyPair.fromPrivate(ephemeralBuf));
    }

    public static async switchKey(bs: BasicStuff, credID: InstanceID, previous: KeyPair): Promise<User> {
        const user = await this.getUser(bs, credID, previous.priv.marshalBinary());
        const newKP = KeyPair.rand();
        const dbs = user.credSignerBS.devices.getValue().find(async (db) => {
            const rules = await db.getValue().ruleMatch(Darc.ruleSign, [previous.signer()], () => undefined);
            return rules.length > 0;
        });

        if (!dbs) {
            throw new Error("didn't find darc with that signer");
        }
        await user.executeTransactions(tx => {
            dbs.setSignEvolve(tx, newKP.signer());
        });
        user.kpp = newKP;
        await user.save();
        return user;
    }

    public static async migrate(bs: BasicStuff): Promise<User | undefined> {
        try {
            const migrate: IMigrate | undefined = await bs.db.getObject(this.keyMigrate);
            if (migrate && migrate.version === this.versionMigrate) {
                // Just suppose everything is here and let it fail otherwise.
                Log.lvl1("Migrating from", migrate);
                const credStruct = CredentialStruct.decode(migrate.contact.credential);
                const seed = credStruct.getAttribute(ECredentials.pub,
                    EAttributesPublic.seedPub);
                if (!seed) {
                    Log.error("couldn't get seed");
                    return undefined;
                }
                const credID = CredentialsInstance.credentialIID(seed);
                if (User.migrateOnce) {
                    await bs.db.set(this.keyMigrate, Buffer.alloc(0));
                }
                const u = await User.getUser(bs, credID, Buffer.from(migrate.keyIdentity, "hex"));
                await u.save();
                return u;
            }
        } catch (e) {
            Log.lvl4("Nothing to migrate from", e)
        }
        return undefined;
    }

    public static async getDbKey(bs: BasicStuff, base = "main"): Promise<Buffer> {
        return bs.db.get(`${base}:${this.keyPriv}`)
    }

    public static async getDbCredID(bs: BasicStuff, base = "main"): Promise<Buffer> {
        return bs.db.get(`${base}:${this.keyCredID}`)
    }

    public static async setDbKey(bs: BasicStuff, buf: Buffer = undefined, base = "main") {
        return bs.db.set(`${base}:${this.keyPriv}`, buf)
    }

    public static async setDbCredID(bs: BasicStuff, buf: Buffer = undefined, base = "main") {
        return bs.db.set(`${base}:${this.keyCredID}`, buf)
    }

    public static async load(bs: BasicStuff, base = "main"): Promise<User> {
        const user = await this.migrate(bs);
        if (user) {
            return user;
        }

        const privBuf = await this.getDbKey(bs, base);
        if (privBuf === undefined) {
            throw new Error("no private key stored");
        }

        const credID = await this.getDbCredID(bs, base);
        if (credID === undefined) {
            throw new Error("no credentialID stored");
        }

        return User.getUser(bs, credID, privBuf, base);
    }

    public async save(base = this.dbBase): Promise<void> {
        await User.setDbKey(this, this.kpp.priv.marshalBinary(), base);
        await User.setDbCredID(this, this.credStructBS.id, base);
    }

    public iCoin(): ICoin {
        return {
            instance: this.coinBS.getValue(),
            signers: [this.kpp.signer()]
        };
    }

    public startTransaction(): Transaction {
        return new Transaction(this.bc, this.spawnerInstanceBS.getValue(), this.iCoin());
    }

    public async executeTransactions(addTxs: (tx: Transaction) => Promise<any> | void, wait = 0): Promise<void> {
        const tx = new Transaction(this.bc, this.spawnerInstanceBS.getValue(), this.iCoin());
        await addTxs(tx);
        await tx.send(wait);
    }
}
