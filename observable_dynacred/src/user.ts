import {KeyPair} from "./keypair";
import {IByzCoinAddTransaction, IDataBase} from "./interfaces";
import {Credentials, EAttributes} from "./credentials";
import {Instances} from "./instances";
import {byzcoin, Log} from "@dedis/cothority";

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

// The user class is to be used only once for a given DB. It is unique for
// one URL-domain and represents the logged in user.
// When calling `User.load`, it tries to migrate from a previous dynacred
// installation.
// If the migration is successful, it uses this configuration, stores the
// new information and deletes the old config.
export class User {
    public static readonly keyPriv = "private";
    public static readonly keyPersonhood = "personhood";
    public static readonly keyCredID = "credID";
    public static readonly keyMigrate = "storage/data.json";
    public static readonly versionMigrate = 1;

    constructor(private db: IDataBase, public readonly credential: Credentials,
                public kp: KeyPair, public kpPersonhood?: KeyPair) {
    }

    get id(): InstanceID {
        return this.credential.id;
    }

    public static async migrate(db: IDataBase, inst: Instances): Promise<User | undefined> {
        try {
            const migrate: IMigrate | undefined = await db.getObject(this.keyMigrate);
            Log.print("migrate is:", migrate);
            if (migrate && migrate.version === this.versionMigrate) {
                // Just suppose everything is here and let it fail otherwise.
                Log.lvl1("Migrating from", migrate);
                const privIDBuf = Buffer.from(migrate.keyIdentity, "hex");
                const credStruct = CredentialStruct.decode(migrate.contact.credential);
                const fields = EAttributes.seed.split(":");
                const seed = credStruct.getAttribute(fields[0], fields[1]);
                if (!seed) {
                    Log.error("couldn't get seed");
                    return undefined;
                }
                const credID = CredentialsInstance.credentialIID(seed);
                const cred = await Credentials.fromScratch(inst, credID);
                const idKP = KeyPair.fromPrivate(privIDBuf);
                let phKP: KeyPair | undefined;
                if (migrate.keyPersonhood) {
                    const privPHBuf = Buffer.from(migrate.keyPersonhood, "hex");
                    phKP = KeyPair.fromPrivate(privPHBuf);
                }
                Log.print("not deleting old config");
                // await db.set(this.keyMigrate, Buffer.alloc(0));
                const u = new User(db, cred, idKP, phKP);
                await u.save();
                return u;
            }
        } catch (e) {
            Log.lvl4("Nothing to migrate from", e)
        }
        return undefined;
    }

    public static async load(db: IDataBase, inst: Instances): Promise<User> {
        const user = await this.migrate(db, inst);
        if (user) {
            return user;
        }

        const privBuf = await db.get(this.keyPriv);
        if (privBuf === undefined) {
            throw new Error("no private key stored");
        }

        const id = await db.get(this.keyCredID);
        if (id === undefined) {
            throw new Error("no credentialID stored");
        }

        let kpPersonhood: KeyPair | undefined;
        try {
            const privPersonhoodBuf = await db.get(this.keyPersonhood);
            if (privPersonhoodBuf !== undefined) {
                kpPersonhood = KeyPair.fromPrivate(privPersonhoodBuf)
            }
        } catch (e) {
            Log.lvl3("No personhood key");
        }

        const kp = KeyPair.fromPrivate(privBuf);
        const cred = await Credentials.fromScratch(inst, id);
        return new User(db, cred, kp, kpPersonhood);
    }

    public async save(): Promise<void> {
        await this.db.set(User.keyPriv, this.kp.priv.marshalBinary());
        if (this.kpPersonhood) {
            await this.db.set(User.keyPersonhood, this.kpPersonhood.priv.marshalBinary());
        }
        await this.db.set(User.keyCredID, this.credential.id);
    }

    public async addContact(bc: IByzCoinAddTransaction, id: InstanceID): Promise<void> {
        return this.credential.addContact(bc, this.kp.priv, id);
    }

    public async rmContact(bc: IByzCoinAddTransaction, id: InstanceID): Promise<void> {
        return this.credential.rmContact(bc, this.kp.priv, id);
    }
}
