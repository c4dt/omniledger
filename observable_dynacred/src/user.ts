import {Scalar} from "@dedis/kyber";
import {Darc, IdentityDarc, SignerEd25519} from "@dedis/cothority/darc";
import {SpawnerInstance} from "@dedis/cothority/byzcoin/contracts";

import {CredentialStructBS,} from "./credentialStructBS";
import {AddressBook} from "./addressBook";
import {KeyPair} from "./keypair";
import {CoinBS} from "./coinBS";
import {CredentialSignerBS} from "./credentialSignerBS";
import {Transaction} from "./transaction";
import {BehaviorSubject} from "rxjs";
import {ICoin} from "./genesis";
import {DarcBS} from "./index";
import {ByzCoinBuilder} from "./builder";
import {ByzCoinBS} from "./byzCoinBS";

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
export class User extends ByzCoinBuilder {
    public static migrateOnce = true;

    constructor(
        public bs: ByzCoinBS,
        public kpp: KeyPair,
        public dbBase: string,
        public credStructBS: CredentialStructBS,
        public spawnerInstanceBS: BehaviorSubject<SpawnerInstance>,
        public coinBS: CoinBS,
        public credSignerBS: CredentialSignerBS,
        public addressBook: AddressBook) {
        super(bs);
    }

    get kiSigner(): SignerEd25519 {
        return this.kpp.signer();
    }

    get identityDarcSigner(): IdentityDarc {
        return new IdentityDarc({id: this.credSignerBS.getValue().getBaseID()});
    }

    public async switchKey(previous: KeyPair): Promise<KeyPair> {
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
        await this.executeTransactions(tx => {
            dbs.setSignEvolve(tx, newKP.signer());
        }, 10);
        this.kpp = newKP;
        await this.save();
        return newKP;
    }

    public getUrlForDevice(priv: Scalar): string {
        return `${User.urlNewDevice}?` +
            `credentialIID=${this.credStructBS.id.toString("hex")}` +
            `&ephemeral=${priv.marshalBinary().toString("hex")}`;
    }

    public async save(base = this.dbBase, priv = this.kpp.priv.marshalBinary(),
                      credID = this.credStructBS.id): Promise<void> {
        await this.db.set(`${base}:${User.keyPriv}`, priv);
        await this.db.set(`${base}:${User.keyCredID}`, credID);
    }

    public async clearDB(base = this.dbBase) {
        return this.save(base, Buffer.alloc(0), Buffer.alloc(0))
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

    public async executeTransactions(addTxs: (tx: Transaction) => Promise<unknown> | unknown, wait = 0): Promise<void> {
        const tx = new Transaction(this.bc, this.spawnerInstanceBS.getValue(), this.iCoin());
        await addTxs(tx);
        await tx.send(wait);
    }
}
