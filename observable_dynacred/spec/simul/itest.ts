import {Log, network} from "@dedis/cothority";

import {User} from "src/user";

import {ByzCoinSimul} from "spec/simul/byzcoinSimul";
import {TempDB} from "spec/simul/tempdb";
import {ROSTER, startConodes} from "spec/support/conondes";
import {curve} from "@dedis/kyber";
import Long from "long";
import {ByzCoinRPC} from "@dedis/cothority/byzcoin";
import {LeaderConnection} from "@dedis/cothority/network/connection";
import {Genesis, IGenesisUser} from "src/genesis";

Log.lvl = 2;
const simul = true;

const ed25519 = curve.newCurve("edwards25519");

export class BCTestEnv extends Genesis {
    public user: User;
    public roster: network.Roster;
    public bcSimul: ByzCoinSimul;

    static async start(simulOnly = false): Promise<BCTestEnv> {
        if (simul) {
            return this.simul();
        } else {
            if (simulOnly) {
                throw new Error("running for real");
            }
            return this.real();
        }
    }

    static async fromScratch(createBC: (igd: IGenesisUser) => Promise<ByzCoinRPC>): Promise<BCTestEnv> {
        const genesis = new Genesis();
        Log.lvl3("Creating Genesis user (darc + signer)");
        genesis.createGenesisDarc(ed25519.scalar().one());
        Log.lvl3("creating BC");
        await genesis.createByzCoin(createBC);
        Log.lvl3("creating user");
        await User.createUser(genesis);
        Log.lvl3("done");
        return new BCTestEnv(genesis);
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
}
