import { BehaviorSubject } from "rxjs";

import { ByzCoinRPC, IStorage } from "@dedis/cothority/byzcoin";
import { CredentialsInstance, CredentialStruct, SpawnerInstance } from "@dedis/cothority/byzcoin/contracts";
import { Darc, IdentityDarc, SignerEd25519 } from "@dedis/cothority/darc";
import { Scalar } from "@dedis/kyber";

import { Log } from "@dedis/cothority";
import { LongTermSecret } from "@dedis/cothority/calypso";
import { AddressBook } from "./addressBook";
import { CoinBS } from "./byzcoin/coinBS";
import { DarcBS } from "./byzcoin/darcsBS";
import { Calypso } from "./calypso";
import { CredentialSignerBS } from "./credentialSignerBS";
import { CredentialStructBS, EAttributesPublic, ECredentials } from "./credentialStructBS";
import { ICoin } from "./genesis";
import { KeyPair } from "./keypair";
import { SpawnerTransactionBuilder } from "./spawnerTransactionBuilder";
import { bufferToObject } from "./utils";

/**
 * The User-class has references to all other needed classes.
 * Its only additional data is the private key, which is not available in any other class.
 * To allow for multiple users in the same db, `dbBase` is prefixed to all keys used by the user.
 *
 * To instantiate a user class, you should use one of the Builder.retrieveUser* methods.
 *
 * The user class and all classes it references are built on a simple premise:
 * the only necessary data is the credential-ID and the private key.
 * All other data is fetched live from the chain.
 * A caching system makes sure that this loading is fast after a first warming up of the cache.
 * Interacting with ByzCoin is optimized to only fetch changes of the instances.
 */
export class User {

    get kiSigner(): SignerEd25519 {
        return this.kpp.signer();
    }

    get identityDarcSigner(): IdentityDarc {
        return new IdentityDarc({ id: this.credSignerBS.getValue().getBaseID() });
    }
    static readonly keyPriv = "private";
    static readonly keyCredID = "credID";
    static readonly keyMigrate = "storage/data.json";
    static readonly versionMigrate = 1;
    static readonly urlNewDevice = "/register/device";

    static async migrate(dbFrom: IStorage, dbNew = dbFrom, base = "main"): Promise<void> {
        Log.lvl3("trying to migrate");
        const userData = await dbFrom.get(User.keyMigrate);
        if (!userData) {
            throw new Error("didn't find any user data");
        }
        const migrate = bufferToObject(userData) as IMigrate;
        Log.lvl1("Migrating from:", migrate);
        if (migrate.version !== User.versionMigrate) {
            Log.warn("Trying to migrate an old account - good luck");
        }

        // Just suppose everything is here and let it fail otherwise.
        const credStruct = CredentialStruct.decode(migrate.contact.credential);
        const seed = credStruct.getAttribute(ECredentials.pub,
            EAttributesPublic.seedPub);
        if (!seed) {
            throw new Error("couldn't get seed");
        }
        const credID = CredentialsInstance.credentialIID(seed);
        const privKey = Buffer.from(migrate.keyIdentity, "hex");
        await dbNew.set(`${base}:${User.keyPriv}`, privKey);
        await dbNew.set(`${base}:${User.keyCredID}`, credID);
        Log.lvl1("Successfully written private key and credID");
    }

    constructor(
        public bc: ByzCoinRPC,
        public db: IStorage,
        public kpp: KeyPair,
        public dbBase: string,
        public credStructBS: CredentialStructBS,
        public spawnerInstanceBS: BehaviorSubject<SpawnerInstance>,
        public coinBS: CoinBS,
        public credSignerBS: CredentialSignerBS,
        public addressBook: AddressBook,
        public calypso?: Calypso) {
    }

    async switchKey(previous: KeyPair): Promise<KeyPair> {
        const newKP = KeyPair.rand();
        let dbs: DarcBS;
        for (const db of this.credSignerBS.devices.getValue()) {
            const rules = await db.getValue().ruleMatch(Darc.ruleSign, [previous.signer()], () => undefined);
            if (rules.length > 0) {
                dbs = db;
            }
        }

        if (!dbs) {
            throw new Error("didn't find darc with that signer");
        }
        await this.executeTransactions((tx) => {
            dbs.setSignEvolve(tx, newKP.signer());
        }, 10);
        this.kpp = newKP;
        await this.save();
        return newKP;
    }

    getUrlForDevice(priv: Scalar): string {
        return `${User.urlNewDevice}?` +
            `credentialIID=${this.credStructBS.id.toString("hex")}` +
            `&ephemeral=${priv.marshalBinary().toString("hex")}`;
    }

    async save(base = this.dbBase, priv = this.kpp.priv.marshalBinary(),
               credID = this.credStructBS.id): Promise<void> {
        await this.db.set(`${base}:${User.keyPriv}`, priv);
        await this.db.set(`${base}:${User.keyCredID}`, credID);
    }

    async clearDB(base = this.dbBase) {
        return this.save(base, Buffer.alloc(0), Buffer.alloc(0));
    }

    iCoin(): ICoin {
        return {
            instance: this.coinBS.getValue(),
            signers: [this.kpp.signer()],
        };
    }

    startTransaction(): SpawnerTransactionBuilder {
        return new SpawnerTransactionBuilder(this.bc, this.spawnerInstanceBS.getValue(), this.iCoin());
    }

    async executeTransactions<T>(addTxs: (tx: SpawnerTransactionBuilder) => Promise<T> | T,
                                 wait = 0): Promise<T> {
        const tx = new SpawnerTransactionBuilder(this.bc, this.spawnerInstanceBS.getValue(), this.iCoin());
        const ret = await addTxs(tx);
        if (tx.hasInstructions()) {
            await tx.sendCoins(wait);
        }
        return ret;
    }
}

export interface IMigrate {
    keyPersonhood?: string;
    keyIdentity: string;
    version?: number;
    contact: { credential: Buffer };
}
