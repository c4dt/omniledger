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
    IUser
} from "src/credentialFactory";
import {DoThings, User} from "src/user";

import {ByzCoinSimul} from "spec/simul/byzcoinSimul";
import {TempDB} from "spec/simul/tempdb";
import {ROSTER} from "spec/support/conondes";
import {curve} from "@dedis/kyber";
import {CredentialStructBS} from "src/credentialStructBS";
import {CoinInstance, SPAWNER_COIN} from "@dedis/cothority/byzcoin/contracts";
import {SpawnerInstance} from "@dedis/cothority/personhood";
import Long from "long";
import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {KeyPair} from "src/keypair";

const ed25519 = curve.newCurve("edwards25519");

Log.lvl = 2;

export interface BCTest extends IByzCoinProof, IByzCoinAddTransaction, IByzCoinBlockStreamer {
}

export interface TestUser extends IUser {
    creds: CredentialStructBS;
}

export class BCTestEnv {
    public inst: Instances;
    public user: User;
    public dt: DoThings;
    public spawnerInstance: SpawnerInstance;
    public spawnerCoin: CoinInstance;
    public roster: network.Roster;

    constructor(public db: IDataBase, public genesisUser: IGenesisDarc, public bc: BCTest) {
    }

    static async fromScratch(createBC: (igd: IGenesisDarc) => Promise<BCTest>): Promise<BCTestEnv> {
        const db = new TempDB();
        Log.lvl3("creating BC");
        const genesisUser = CredentialFactory.genesisDarc(ed25519.scalar().one());
        const bc = await createBC(genesisUser);
        const bcte = new BCTestEnv(db, genesisUser, bc);

        await bcte.finalize();
        return bcte;
    }

    static async simul(): Promise<BCTestEnv> {
        return this.fromScratch(async (igd) => {
            return new ByzCoinSimul(igd);
        });
    }

    static async real(): Promise<BCTestEnv> {
        return this.fromScratch(async (igd) => {
            // await startConodes();
            return await ByzCoinRPC.newByzCoinRPC(ROSTER, igd.darc,
                Long.fromNumber(1e8));
        });
    }

    async finalize(): Promise<void>{
        Log.lvl3("creating instances");
        const inst = await Instances.fromScratch(this.db, this.bc);
        Log.lvl3("creating DoThings");
        const kp = KeyPair.rand();
        this.dt = new DoThings(this.bc, this.db, inst, kp);
        Log.lvl3("creating spawner and first user", this.dt.kiSigner);
        await this.createSpawner();
        await this.createFirstUser();
        Log.lvl3("loading user");
        this.user = await User.load(this.dt);
        Log.lvl3("creating this.bcTestEnv");
    }

    public async createSpawner() {
        Log.lvl3("Storing coin and spawner instances");
        const spawnerCost = CredentialFactory.spawnerCost();
        const signers = [this.genesisUser.keyPair.signer()];
        this.spawnerCoin = await CoinInstance.spawn(this.bc as any, this.genesisUser.darc.getBaseID(),
            signers, SPAWNER_COIN);
        await this.spawnerCoin.mint(signers, Long.fromNumber(1e9));
        this.spawnerInstance = await SpawnerInstance.spawn({
            bc: this.bc as any,
            darcID: this.genesisUser.darc.getBaseID(),
            signers,
            costs: spawnerCost,
            beneficiary: this.spawnerCoin.id,
        });
    }

    public async createFirstUser(): Promise<void> {
        // Create all parts of the test-user
        const user = CredentialFactory.newUser("1st user", this.spawnerInstance.id,
            ed25519.scalar().setBytes(Buffer.from("user")));

        await this.db.set(User.keyPriv, user.keyPair.priv.marshalBinary());
        await this.db.set(User.keyCredID, user.credID || Buffer.alloc(32));
        await this.storeUser(user);
    }

    public async storeUser(user: IUser) {
        const signer = [this.dt.kiSigner];
        const si = this.spawnerInstance;
        const ci = this.spawnerCoin;

        Log.lvl3("Spawning darcs");
        await si.spawnDarcs(ci, signer,
            user.darcSign, user.darcDevice, user.darcCred, user.darcCoin);

        Log.lvl3("Spawning coin");
        const coinInst = await si.spawnCoin(ci, signer,
            user.darcCoin.getBaseID(), user.keyPair.pub.marshalBinary(), Long.fromNumber(1e6));
        if (!user.coinID.equals(coinInst.id)) {
            throw new Error("resulting coinID doesn't match");
        }

        Log.lvl3("Spawning credential");
        const credInst = await si.spawnCredential(ci,
            signer, user.darcCred.getBaseID(), user.cred, user.keyPair.pub.marshalBinary());
        if (!user.credID.equals(credInst.id)) {
            throw new Error("resulting credID doesn't match");
        }
    }

    async newCred(alias: string): Promise<TestUser> {
        const user = CredentialFactory.newUser(alias, this.spawnerInstance.id);
        await this.storeUser(user);
        return {
            creds: await CredentialStructBS.fromScratch(this.dt, user.credID),
            ...user
        };
    }
}
