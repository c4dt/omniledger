import {darc, Log, network} from "@dedis/cothority";

import {
    IByzCoinAddTransaction,
    IByzCoinBlockStreamer,
    IByzCoinProof,
    IDataBase
} from "src/interfaces";
import {Instances} from "src/instances";
import {UserFactory} from "src/userFactory";
import {DoThings, User} from "src/user";

import {ByzCoinSimul} from "spec/simul/byzcoinSimul";
import {TempDB} from "spec/simul/tempdb";
import {ROSTER} from "spec/support/conondes";
import {curve, Scalar} from "@dedis/kyber";
import {CoinInstance, SPAWNER_COIN} from "@dedis/cothority/byzcoin/contracts";
import {
    CredentialsInstance,
    ICreateCost,
    SpawnerInstance
} from "@dedis/cothority/byzcoin/contracts";
import Long from "long";
import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {SignerEd25519} from "@dedis/cothority/darc";
import {KeyPair} from "src/keypair";

const ed25519 = curve.newCurve("edwards25519");

export interface BCTest extends IByzCoinProof, IByzCoinAddTransaction, IByzCoinBlockStreamer {
}

export interface IGenesisDarc {
    keyPair: KeyPair;
    darc: darc.Darc;
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
        const genesisUser = this.genesisDarc(ed25519.scalar().one());
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

    public static genesisDarc(priv?: Scalar): IGenesisDarc {
        const keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [keyPair.signer()];
        const adminDarc = darc.Darc.createBasic(signer, signer,
            Buffer.from("AdminDarc"),
            ["spawn:spawner", "spawn:coin", "spawn:credential", "spawn:longTermSecret",
                "spawn:calypsoWrite", "spawn:calypsoRead", "spawn:darc",
                "invoke:coin.mint", "invoke:coin.transfer", "invoke:coin.fetch"]);
        return {keyPair, darc: adminDarc};
    }

    public static spawnerCost(): ICreateCost {
        const coin10 = Long.fromNumber(10);
        const coin100 = Long.fromNumber(100);
        const coin1000 = Long.fromNumber(1000);
        return {
            costCRead: coin100,
            costCWrite: coin1000,
            costCoin: coin100,
            costCredential: coin1000,
            costDarc: coin100,
            costParty: coin1000,
            costRoPaSci: coin10,
            costValue: coin10,
        };
    }

    async finalize(): Promise<void> {
        Log.lvl3("creating instances");
        const inst = await Instances.fromScratch(this.db, this.bc);
        Log.lvl3("creating DoThings");
        this.dt = new DoThings(this.bc, this.db, inst, this.genesisUser.keyPair);
        Log.lvl3("creating spawner and first user");
        await this.createSpawner();
        await this.createFirstUser();
        Log.lvl3("loading user");
        this.user = await User.load(this.dt);
        Log.lvl3("creating this.bcTestEnv");
    }

    public async createSpawner() {
        Log.lvl3("Storing coin and spawner instances");
        const spawnerCost = BCTestEnv.spawnerCost();
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
        const user = new UserFactory("1st user", this.spawnerInstance.id,
            ed25519.scalar().setBytes(Buffer.from("user")));

        await this.db.set(User.keyPriv, user.keyPair.priv.marshalBinary());
        const credIID = CredentialsInstance.credentialIID(user.keyPair.pub.marshalBinary());
        await this.db.set(User.keyCredID, credIID);
        await this.storeUser(user, this.spawnerCoin, this.genesisUser.keyPair.signer())
    }

    public async storeUser(user: UserFactory, ci: CoinInstance, signer: SignerEd25519) {
        const si = this.spawnerInstance;

        Log.lvl3("Spawning darcs");
        await si.spawnDarcs(ci, [signer],
            user.darcSign, user.darcDevice, user.darcCred, user.darcCoin);

        Log.lvl3("Spawning coin");
        await si.spawnCoin(ci, [signer], user.darcCoin.getBaseID(), user.keyPair.pub.marshalBinary(), Long.fromNumber(1e6));

        Log.lvl3("Spawning credential");
        await si.spawnCredential(ci, [signer], user.darcCred.getBaseID(), user.cred, user.keyPair.pub.marshalBinary());
    }
}
