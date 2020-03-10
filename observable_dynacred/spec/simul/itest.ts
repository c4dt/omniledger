import {Log} from "@dedis/cothority";

import {User} from "src/user";

import {ByzCoinSimul} from "spec/simul/byzcoinSimul";
import {ROSTER, startConodes} from "spec/support/conondes";
import {curve} from "@dedis/kyber";
import Long from "long";
import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {LeaderConnection} from "@dedis/cothority/network/connection";
import {Genesis, IGenesisUser} from "src/genesis";
import {UserSkeleton} from "observable_dynacred";

Log.lvl = 2;
const simul = false;

const ed25519 = curve.newCurve("edwards25519");

let bct: BCTestEnv;
let bctError: Error;

export class BCTestEnv extends Genesis {
    public bcSimul?: ByzCoinSimul;

    constructor(
        g: Genesis,
        public user: User) {
        super(g);
    }

    static async start(): Promise<BCTestEnv> {
        if (bct){
            return bct;
        }
        if (bctError){
            throw bctError;
        }
        try {
            bct = simul ? await this.simul() : await this.real();
            return bct;
        } catch (e) {
            bctError = e;
            await Log.rcatch(e, "couldn't start bctestenv");
        }
    }

    static async fromScratch(createBC: (igd: IGenesisUser) => Promise<ByzCoinRPC>): Promise<BCTestEnv> {
        Log.lvl3("Creating Genesis user (darc + signer) and BC");
        const genesis = await Genesis.fromGenesisKey(ed25519.scalar().one(), createBC);
        Log.lvl3("creating spawner");
        await genesis.createSpawner();
        Log.lvl3("creating user");
        return new BCTestEnv(genesis, await genesis.createUser());
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
        const bcte = await this.fromScratch(async (igd) => {
            // await startConodes();
            const bc = await ByzCoinRPC.newByzCoinRPC(ROSTER, igd.darc,
                Long.fromNumber(1e8));
            const conn = new LeaderConnection(ROSTER, ByzCoinRPC.serviceName);
            return ByzCoinRPC.fromByzcoin(conn, bc.genesisID);
        });
        Log.lvl1("Successfully started real-byzcoin");
        return bcte;
    }

    public async createUser(alias: string): Promise<User>{
        Log.lvl3("creating new user", alias);
        const skel = new UserSkeleton(alias, this.user.spawnerInstanceBS.getValue().id);
        await this.user.executeTransactions(tx => {
            tx.createUser(skel, Long.fromNumber(1e6));
        }, 10);
        const u = this.getUser(skel.credID, skel.keyPair.priv.marshalBinary(), `db${alias}`);
        Log.lvl3("finished creating new user");
        return u;
    }
}
