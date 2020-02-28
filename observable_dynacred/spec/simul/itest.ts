import {darc, Log, network} from "@dedis/cothority";

import {IDataBase} from "src/interfaces";
import {Instances} from "src/instances";
import {UserFactory} from "src/userFactory";
import {BasicStuff, User} from "src/user";

import {ByzCoinSimul} from "spec/simul/byzcoinSimul";
import {TempDB} from "spec/simul/tempdb";
import {ROSTER, startConodes} from "spec/support/conondes";
import {curve, Scalar} from "@dedis/kyber";
import {
    CoinInstance,
    CredentialsInstance,
    ICreateCost,
    SPAWNER_COIN,
    SpawnerInstance
} from "@dedis/cothority/byzcoin/contracts";
import Long from "long";
import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {IdentityDarc} from "@dedis/cothority/darc";
import {KeyPair} from "src/keypair";
import {LeaderConnection} from "@dedis/cothority/network/connection";
import {Transaction} from "src/transaction";

Log.lvl = 2;
const simul = true;

const ed25519 = curve.newCurve("edwards25519");

export interface IGenesisDarc {
    keyPair: KeyPair;
    darc: darc.Darc;
}

export class BCTestEnv {
    public user: User;
    public spawnerInstance: SpawnerInstance;
    public spawnerCoin: CoinInstance;
    public roster: network.Roster;
    public bcSimul: ByzCoinSimul;

    constructor(public db: IDataBase,
                public genesisUser: IGenesisDarc,
                public bc: ByzCoinRPC,
                public inst: Instances) {
    }

    static async start(simulOnly = false): Promise<BCTestEnv> {
        if (simul) {
            return this.simul();
        } else {
            if (simulOnly){
                throw new Error("running for real");
            }
            return this.real();
        }
    }

    static async fromScratch(createBC: (igd: IGenesisDarc) => Promise<ByzCoinRPC>): Promise<BCTestEnv> {
        const db = new TempDB();
        Log.lvl3("creating BC");
        const genesisUser = this.genesisDarc(ed25519.scalar().one());
        const bc = await createBC(genesisUser);
        const bcte = new BCTestEnv(db, genesisUser, bc, await Instances.fromScratch(db, bc));
        Log.lvl3("creating instances");

        await bcte.finalize();
        return bcte;
    }

    static async simul(): Promise<BCTestEnv> {
        let bcs: ByzCoinSimul;
        const bcte = await this.fromScratch(async (igd) => {
            bcs = new ByzCoinSimul(igd) as any;
            return bcs as any;
        });
        bcte.bcSimul = bcs;
        Log.lvl1("Successfully started simulation");
        return bcte;
    }

    static async real(): Promise<BCTestEnv> {
        const bcte = this.fromScratch(async (igd) => {
            await startConodes();
            const bc = await ByzCoinRPC.newByzCoinRPC(ROSTER, igd.darc,
                Long.fromNumber(1e8));
            const conn = new LeaderConnection(ROSTER, ByzCoinRPC.serviceName);
            return ByzCoinRPC.fromByzcoin(conn, bc.genesisID);
        });
        Log.lvl1("Successfully started real-byzcoin");
        return bcte;
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
        Log.lvl3("creating spawner and first user");
        await this.createSpawner();
        await this.createFirstUser();
        Log.lvl3("loading user");
        this.user = await User.load(new BasicStuff({
            bc: this.bc,
            db: this.db,
            inst: this.inst,
        }));
    }

    public async createSpawner() {
        Log.lvl3("Storing coin and spawner instances");
        const spawnerCost = BCTestEnv.spawnerCost();
        const signers = [this.genesisUser.keyPair.signer()];
        this.spawnerCoin = await CoinInstance.spawn(this.bc, this.genesisUser.darc.getBaseID(),
            signers, SPAWNER_COIN);
        await this.spawnerCoin.mint(signers, Long.fromNumber(1e9));
        this.spawnerInstance = await SpawnerInstance.spawn({
            bc: this.bc,
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

        await this.db.set(`main:${User.keyPriv}`, user.keyPair.priv.marshalBinary());
        const credIID = CredentialsInstance.credentialIID(user.keyPair.pub.marshalBinary());
        await this.db.set(`main:${User.keyCredID}`, credIID);
        const tx = new Transaction(this.bc, this.spawnerInstance, this.spawnerCoin,
            new IdentityDarc({id: this.genesisUser.darc.getBaseID()}), this.genesisUser.keyPair.signer());
        tx.createUser(user, Long.fromNumber(1e6));
        await tx.send(2);
    }
}
