import {Log} from "@dedis/cothority";
import {CredentialStructBS, EAttributesPublic, ECredentials,} from "./credentialStructBS";
import {AddressBook} from "./addressBook";
import {ByzCoinRPC, InstanceID} from "@dedis/cothority/byzcoin";
import {CredentialsInstance, CredentialStruct, SpawnerInstance} from "@dedis/cothority/byzcoin/contracts";
import {KeyPair} from "./keypair";
import {CoinBS} from "./coinBS";
import {CredentialSignerBS} from "./signers";
import {IdentityDarc, SignerEd25519} from "@dedis/cothority/darc";
import {Transaction} from "./transaction";
import {IDataBase} from "./interfaces";
import {Instances} from "./instances";
import {BehaviorSubject} from "rxjs";
import {ObservableToBS} from "./observableHO";
import {flatMap} from "rxjs/operators";

export interface IMigrate {
    keyPersonhood?: string;
    keyIdentity: string;
    version: number;
    contact: IMigrateContact;
}

export interface IMigrateContact {
    credential: Buffer;
}

interface IBasicStuff {
    bc: ByzCoinRPC;
    db: IDataBase;
    inst: Instances;
}

export class BasicStuff implements IBasicStuff {
    public bc: ByzCoinRPC;
    public db: IDataBase;
    public inst: Instances;

    constructor(bs: IBasicStuff | BasicStuff) {
        this.bc = bs.bc;
        this.db = bs.db;
        this.inst = bs.inst;
    }
}

// The user class is to be used only once for a given DB. It is unique for
// one URL-domain and represents the logged in user.
// When calling `User.load`, it tries to migrate from a previous dynacred
// installation.
// If the migration is successful, it uses this configuration, stores the
// new information and deletes the old config.
export class User extends BasicStuff {
    static readonly urlNewDevice = "/register/device";
    public static readonly keyPriv = "private";
    public static readonly keyCredID = "credID";
    public static readonly keyMigrate = "storage/data.json";
    public static readonly versionMigrate = 1;
    public static migrateOnce = false;

    constructor(bs: BasicStuff,
                public kpp: KeyPair,
                private dbKey: string,
                public credStructBS: CredentialStructBS,
                public spawnerInstanceBS: BehaviorSubject<SpawnerInstance>,
                public coinBS: CoinBS,
                public credSignerBS: CredentialSignerBS,
                public readonly addressBook: AddressBook) {
        super({...bs});
    }

    get kiSigner(): SignerEd25519 {
        return new SignerEd25519(this.kpp.pub, this.kpp.priv);
    }

    get darcSigner(): IdentityDarc {
        return new IdentityDarc({id: this.credSignerBS.getValue().getBaseID()});
    }

    public static async createUser(bs: BasicStuff, credID: InstanceID, privBuf: Buffer,
                                   dbKey = "main"): Promise<User> {
        const credStructBS = await CredentialStructBS.createCredentialStructBS(bs, credID);
        const siBS = await ObservableToBS(credStructBS.credConfig.spawnerID.pipe(
            flatMap(id => SpawnerInstance.fromByzcoin(bs.bc, id))));
        Log.lvl3("getting coinBS");
        const coinBS = await CoinBS.createCoinBS(bs, credStructBS.credPublic.coinID);
        Log.lvl3("getting credentialSignerBS");
        const credSignerBS = await CredentialSignerBS.createCredentialSignerBS(bs, credStructBS);
        Log.lvl3("getting address book");
        const addressBook = await AddressBook.createAddressBook(bs, credStructBS.credPublic);
        return new User(bs, KeyPair.fromPrivate(privBuf), dbKey,
            credStructBS, siBS, coinBS, credSignerBS, addressBook);
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
                const u = await User.createUser(bs, credID, Buffer.from(migrate.keyIdentity, "hex"));
                await u.save();
                return u;
            }
        } catch (e) {
            Log.llvl4("Nothing to migrate from", e)
        }
        return undefined;
    }

    public static async load(bs: BasicStuff, dbKey = "main"): Promise<User> {
        const user = await this.migrate(bs);
        if (user) {
            return user;
        }

        Log.print("loading", dbKey, this.keyPriv);
        const privBuf = await bs.db.get(`${dbKey}:${this.keyPriv}`);
        if (privBuf === undefined) {
            throw new Error("no private key stored");
        }

        const credID = await bs.db.get(`${dbKey}:${this.keyCredID}`);
        if (credID === undefined) {
            throw new Error("no credentialID stored");
        }

        Log.print("privBuf - credID", privBuf, credID);

        return User.createUser(bs, credID, privBuf, dbKey);
    }

    public async save(dbKey = this.dbKey): Promise<void> {
        Log.print("setting", dbKey, User.keyPriv);
        await this.db.set(`${dbKey}:${User.keyPriv}`, this.kpp.priv.marshalBinary());
        await this.db.set(`${dbKey}:${User.keyCredID}`, this.credStructBS.id);
    }

    public startTransaction(): Transaction {
        return new Transaction(this.bc, this.spawnerInstanceBS.getValue(), this.coinBS.getValue(), this.darcSigner, this.kiSigner);
    }

    public async executeTransactions(addTxs: (tx: Transaction) => Promise<void> | void, wait = 0): Promise<void> {
        const tx = new Transaction(this.bc, this.spawnerInstanceBS.getValue(), this.coinBS.getValue(), this.darcSigner, this.kiSigner);
        await addTxs(tx);
        await tx.send(wait);
    }
}
