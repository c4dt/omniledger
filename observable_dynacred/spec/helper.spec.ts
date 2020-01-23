import {ByzCoinSimul, IByzCoinProof} from "../src/byzcoin-simul";
import {Instances} from "../src/instances";
import {IDataBase, TempDB} from "../src/tempdb";
import {User} from "../src/user";

export interface ITestUser {
    db: IDataBase;
    bc: ByzCoinSimul;
    inst: Instances;
    user: User;
}

export async function createUser(): Promise<ITestUser> {
    const db = new TempDB();
    const bc = new ByzCoinSimul();
    const inst = await Instances.fromScratch(db, bc);
    const test = await bc.newTest("alias", db, inst);
    if (test.user.credID === undefined) {
        throw new Error("user.credID shouldn't be undefined");
    }
    return {
        bc, db, inst,
        user: await User.load(db, inst),
    };
}
