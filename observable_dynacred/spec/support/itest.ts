import {Log} from "@dedis/cothority";
import ByzCoinRPC from "@dedis/cothority/byzcoin/byzcoin-rpc";
import Long = require("long");

import {IDataBase, IGenesisDarc, ISpawner, IUser} from "src/basics";
import {Instances} from "src/instances";
import {CredentialFactory} from "src/credentialFactory";
import {User} from "src/user";

import {ByzCoinSimul} from "spec/support/byzcoinSimul";
import {TempDB} from "spec/support/tempdb";
import {ByzCoinReal} from "spec/support/byzcoinReal";
import {ROSTER} from "spec/support/conondes";

Log.lvl = 1;

export interface ITest {
    genesisUser: IGenesisDarc;
    spawner: ISpawner;
    user: IUser;
}

export interface IBCUser {
    db: IDataBase;
    bc: ByzCoinRPC;
    inst: Instances;
    user: User;
    test: ITest;
}

export interface ISimulUser {
    db: IDataBase;
    bc: ByzCoinSimul;
    inst: Instances;
    user: User;
    test: ITest;
}

export async function createSimulUser(): Promise<ISimulUser> {
    const db = new TempDB();
    const bc = new ByzCoinSimul();
    const inst = await Instances.fromScratch(db, bc);
    const test = await newTest("alias", db);
    await bc.storeTest(test);
    return {
        bc, db, inst, test,
        user: await User.load(db, inst),
    };
}

export async function createBCUser(): Promise<IBCUser> {
    const db = new TempDB();
    const test = await newTest("alias", db);
    // await startConodes();
    const roster = ROSTER.slice(0, 4);
    const bc = await ByzCoinRPC.newByzCoinRPC(roster, test.genesisUser.darc, Long.fromNumber(1000));
    const inst = await Instances.fromScratch(db, new ByzCoinReal(bc));
    return {
        bc, db, inst, test,
        user: await User.load(db, inst),
    };
}

export async function newTest(alias: string, db: IDataBase): Promise<ITest> {
    // Create all parts of the test-user
    const genesisUser = CredentialFactory.genesisDarc();
    const spawner = CredentialFactory.spawner(genesisUser);
    const user = CredentialFactory.newUser(alias, spawner.spawnerID);

    await db.set(User.keyPriv, user.keyPair.priv.marshalBinary());
    await db.set(User.keyCredID, user.credID || Buffer.alloc(32));
    return {genesisUser, spawner, user};
}
