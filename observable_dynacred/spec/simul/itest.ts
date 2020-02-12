import {Log, network} from "@dedis/cothority";

import {
    IByzCoinAddTransaction,
    IByzCoinBlockStreamer,
    IByzCoinProof,
    IDataBase
} from "src/interfaces";
import {Instances} from "src/instances";
import {
    CredentialFactory,
    IGenesisDarc,
    ISpawner,
    IUser
} from "src/credentialFactory";
import {DoThings, User} from "src/user";

import {ByzCoinSimul} from "spec/simul/byzcoinSimul";
import {TempDB} from "spec/simul/tempdb";
import {ByzCoinReal} from "spec/simul/byzcoinReal";
import {ROSTER} from "spec/support/conondes";
import {curve} from "@dedis/kyber";
import {CredentialStructBS} from "src/credentialStructBS";

const ed25519 = curve.newCurve("edwards25519");

Log.lvl = 2;

export interface ITest {
    genesisUser: IGenesisDarc;
    spawner: ISpawner;
    user: IUser;
    roster: network.Roster;
}

export interface BCTest extends IByzCoinProof, IByzCoinAddTransaction, IByzCoinBlockStreamer {
    storeUser(user: IUser): Promise<void>;
}

export interface TestUser extends IUser {
    creds: CredentialStructBS;
}

export class BCTestEnv {
    constructor(
        public bc: BCTest,
        public db: IDataBase,
        public inst: Instances,
        public test: ITest,
        public user: User,
        public dt: DoThings
    ) {
    }

    static async fromScratch(createBC: (test: ITest, db: IDataBase) => Promise<BCTest>): Promise<BCTestEnv> {
        const db = new TempDB();
        const test = await this.newTest("alias", db);
        const bc = await createBC(test, db);
        const inst = await Instances.fromScratch(db, bc);
        const dt = new DoThings(bc, db, inst, test.user.keyPair);
        return new BCTestEnv(
            bc, db, inst, test,
            await User.load(dt),
            dt);
    }

    static async simul(): Promise<BCTestEnv> {
        return this.fromScratch(async (test) => {
            return await ByzCoinSimul.fromScratch(test);
        });
    }

    static async real(): Promise<BCTestEnv> {
        return this.fromScratch(async (test, db) => {
            // await startConodes();
            return ByzCoinReal.fromScratch(test.roster, test, db);
        });
    }

    private static async newTest(alias: string, db: IDataBase): Promise<ITest> {
        // Create all parts of the test-user
        const genesisUser = CredentialFactory.genesisDarc(ed25519.scalar().one());
        const spawner = CredentialFactory.spawner(genesisUser);
        const user = CredentialFactory.newUser(alias, spawner.spawnerID,
            ed25519.scalar().setBytes(Buffer.from("user")));

        await db.set(User.keyPriv, user.keyPair.priv.marshalBinary());
        await db.set(User.keyCredID, user.credID || Buffer.alloc(32));
        return {genesisUser, spawner, user, roster: ROSTER.slice(0, 4)};
    }

    async newCred(alias: string): Promise<TestUser> {
        const user = CredentialFactory.newUser(alias, this.test.spawner.spawnerID);
        await this.bc.storeUser(user);
        return {
            creds: await CredentialStructBS.fromScratch(this.dt, user.credID),
            ...user
        };
    }
}
