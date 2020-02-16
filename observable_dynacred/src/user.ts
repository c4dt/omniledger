import {byzcoin, Log} from "@dedis/cothority";
import {Signer, SignerEd25519} from "@dedis/cothority/darc";

import {KeyPair} from "./keypair";
import {IByzCoinAddTransaction, IByzCoinProof, IDataBase} from "./interfaces";
import {
    CredentialStructBS,
    EAttributesPublic,
    ECredentials,
} from "./credentialStructBS";
import {Instances} from "./instances";
import {ContactListBS} from "./contactListBS";
import {CoinBS} from "./coinBS";
import {CredentialSignerBS} from "src/signers";
import {SpawnerInstance} from "@dedis/cothority/personhood";

type InstanceID = byzcoin.InstanceID;
const {CredentialStruct, CredentialsInstance} = byzcoin.contracts;

export interface IMigrate {
    keyPersonhood?: string;
    keyIdentity: string;
    version: number;
    contact: IMigrateContact;
}

export interface IMigrateContact {
    credential: Buffer;
}

export class DoThings {
    public kiSigner: Signer;

    constructor(
        public bc: IByzCoinAddTransaction & IByzCoinProof,
        public db: IDataBase,
        public inst: Instances,
        private kpp?: KeyPair,
        public coin?: CoinBS,
        public spawner?: SpawnerInstance,
    ) {
        if (kpp) {
            this.kp = kpp;
        }
    }

    get kp(): KeyPair {
        return this.kpp;
    }

    set kp(k: KeyPair) {
        this.kpp = k;
        this.kiSigner = new SignerEd25519(k.pub, k.priv);
    }
}

// The user class is to be used only once for a given DB. It is unique for
// one URL-domain and represents the logged in user.
// When calling `User.load`, it tries to migrate from a previous dynacred
// installation.
// If the migration is successful, it uses this configuration, stores the
// new information and deletes the old config.
export class User {
    public static readonly keyPriv = "private";
    public static readonly keyCredID = "credID";
    public static readonly keyMigrate = "storage/data.json";
    public static readonly versionMigrate = 1;
    public static migrateOnce = false;

    constructor(public dt: DoThings,
                public readonly csbs: CredentialStructBS,
                public readonly contactList: ContactListBS,
                public readonly coin: CoinBS,
                public readonly credSigner: CredentialSignerBS) {
    }

    public static async fromScratch(dt: DoThings, credID: InstanceID): Promise<User> {
        Log.lvl3("creating user from scratch");
        const cbs = await CredentialStructBS.fromScratch(dt, credID);
        if (dt.coin === undefined) {
            Log.lvl3("creating coinBS");
            dt.coin = await CoinBS.fromScratch(dt, cbs.credPublic.coinID);
        }
        if (dt.spawner === undefined) {
            Log.lvl3("creating spawnerinstance");
            dt.spawner = await SpawnerInstance.fromByzcoin(dt.bc as any,
                cbs.credConfig.spawner.getValue());
        }
        Log.lvl3("creating contactListBS");
        const clbs = new ContactListBS(dt, cbs.credPublic.contacts);
        Log.lvl3("creating credentialSignerBS");
        const csbs = await CredentialSignerBS.fromScratch(dt, cbs);
        return new User(dt, cbs, clbs, dt.coin, csbs);
    }

    public static async migrate(dt: DoThings): Promise<User | undefined> {
        try {
            const migrate: IMigrate | undefined = await dt.db.getObject(this.keyMigrate);
            if (migrate && migrate.version === this.versionMigrate) {
                // Just suppose everything is here and let it fail otherwise.
                Log.lvl1("Migrating from", migrate);
                const privIDBuf = Buffer.from(migrate.keyIdentity, "hex");
                dt.kp = KeyPair.fromPrivate(privIDBuf);
                const credStruct = CredentialStruct.decode(migrate.contact.credential);
                const seed = credStruct.getAttribute(ECredentials.pub,
                    EAttributesPublic.seedPub);
                if (!seed) {
                    Log.error("couldn't get seed");
                    return undefined;
                }
                const credID = CredentialsInstance.credentialIID(seed);
                if (User.migrateOnce) {
                    await dt.db.set(this.keyMigrate, Buffer.alloc(0));
                }
                const u = await User.fromScratch(dt, credID);
                await u.save();
                return u;
            }
        } catch (e) {
            Log.lvl4("Nothing to migrate from", e)
        }
        return undefined;
    }

    public static async load(dt: DoThings): Promise<User> {
        const user = await this.migrate(dt);
        if (user) {
            return user;
        }

        const privBuf = await dt.db.get(this.keyPriv);
        if (privBuf === undefined) {
            throw new Error("no private key stored");
        }

        const credID = await dt.db.get(this.keyCredID);
        if (credID === undefined) {
            throw new Error("no credentialID stored");
        }

        dt.kp = KeyPair.fromPrivate(privBuf);
        return User.fromScratch(dt, credID);
    }

    public async save(): Promise<void> {
        await this.dt.db.set(User.keyPriv, this.dt.kp.priv.marshalBinary());
        await this.dt.db.set(User.keyCredID, this.csbs.id);
    }
}
