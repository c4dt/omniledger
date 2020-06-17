import Long from "long";

import { Log } from "@dedis/cothority";
import { ByzCoinRPC, IStorage } from "@dedis/cothority/byzcoin";
import { LeaderConnection, RosterWSConnection } from "@dedis/cothority/network";
import { curve } from "@dedis/kyber";

import { Genesis, IGenesisUser, User, UserSkeleton } from "dynacred";

import { StatusRPC } from "@dedis/cothority/status";
import { StatusRequest, StatusResponse } from "@dedis/cothority/status/proto";
import { ByzCoinSimul } from "spec/simul/byzcoinSimul";
import { ROSTER, startConodes } from "spec/support/conodes";

Log.lvl = 2;
export const simul = true;

const ed25519 = curve.newCurve("edwards25519");

let bct: BCTestEnv;
let bctError: Error;

export class BCTestEnv extends Genesis {

    static async start(): Promise<BCTestEnv> {
        if (bct) {
            return bct;
        }
        if (bctError) {
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

    static async fromScratch(createBC: (igd: IGenesisUser, db: IStorage) => Promise<ByzCoinRPC>): Promise<BCTestEnv> {
        Log.lvl3("Creating Genesis user (darc + signer) and BC");
        const genesis = await Genesis.create(ed25519.scalar().one(), createBC);
        Log.lvl3("creating spawner");
        await genesis.createSpawner();
        Log.lvl3("creating user");
        return new BCTestEnv(genesis, await genesis.createUser());
    }

    static async simul(): Promise<BCTestEnv> {
        let bcs: ByzCoinSimul;
        const bcte = await this.fromScratch(async (igd, db) => {
            bcs = new ByzCoinSimul(db, igd) as any;
            return bcs as any;
        });
        bcte.bcSimul = bcs;
        Log.lvl1("Successfully started simulation");
        return bcte;
    }

    static async real(): Promise<BCTestEnv> {
        const bcte = await this.fromScratch(async (igd, db) => {
            try {
                const ws = new RosterWSConnection(ROSTER, StatusRPC.serviceName);
                ws.setParallel(1);
                await ws.send(new StatusRequest(), StatusResponse);
                Log.warn("Using already running nodes for test!");
            } catch (e) {
                await startConodes();
            }
            const bc = await ByzCoinRPC.newByzCoinRPC(ROSTER, igd.darc,
                Long.fromNumber(1e8));
            const conn = new LeaderConnection(ROSTER, ByzCoinRPC.serviceName);
            return ByzCoinRPC.fromByzcoin(conn, bc.genesisID, 0, 1000, undefined, db);
        });
        Log.lvl1("Successfully started real-byzcoin");
        return bcte;
    }

    bcSimul?: ByzCoinSimul;

    constructor(
        g: Genesis,
        public user: User) {
        super(g.db, g.bc, g.genesisUser, g.spawner, g.coin);
    }

    async createUser(alias: string): Promise<User> {
        Log.lvl3("creating new user", alias);
        const skel = new UserSkeleton(alias, this.user.spawnerInstanceBS.getValue().id);
        await this.user.executeTransactions((tx) => {
            tx.createUser(skel, Long.fromNumber(1e6));
        }, 10);
        const u = this.retrieveUser(skel.credID, skel.keyPair.priv.marshalBinary(), `db${alias}`);
        Log.lvl3("finished creating new user");
        return u;
    }
}
