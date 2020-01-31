import {ByzCoinSimul} from "../src/byzcoin-simul";
import {Instances} from "../src/instances";
import {IDataBase, TempDB} from "../src/tempdb";
import {User} from "../src/user";
import {ITest} from "../src/simulation";
import {Log} from "@dedis/cothority";

Log.lvl = 1;

export interface ITestUser {
    db: IDataBase;
    bc: ByzCoinSimul;
    inst: Instances;
    user: User;
    test: ITest;
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
        bc, db, inst, test,
        user: await User.load(db, inst),
    };
}

export class History {

    private readonly entries: string[] = [];

    public push(...e: string[]) {
        this.entries.push(...e);
    }

    public async resolve(newEntries: string[], complete?: boolean): Promise<void> {
        await expectAsync(this.expect(newEntries, true, complete)).toBeResolved();
    }

    public async reject(newEntries: string[], complete?: boolean): Promise<void> {
        await expectAsync(this.expect(newEntries, false, complete)).toBeRejected();
    }

    public async expect(newEntries: string[], succeed: boolean, complete?: boolean): Promise<void> {
        return new Promise(async (res, rej) => {
            try {
                for (let i = 0; i < 5 && this.entries.length < newEntries.length; i++) {
                    Log.lvl2("waiting", i, this.entries.length, newEntries.length);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                if (succeed) {
                    Log.lvl2("History:", this.entries, "wanted:", newEntries);
                } else {
                    Log.lvl2("Want history:", this.entries, "to fail with:", newEntries);
                }
                if (this.entries.length < newEntries.length) {
                    throw new Error("not enough entries");
                }
                for (const e of newEntries) {
                    const h = this.entries.splice(0, 1)[0];
                    if (e !== h) {
                        throw new Error(`Got ${h} instead of ${e}`);
                    }
                }
                if (complete && this.entries.length !== 0) {
                    throw new Error(`didn't describe all history: ${this.entries}`);
                }
                res();
            } catch (e) {
                if (succeed) {
                    Log.error(e);
                }
                rej(e);
            }
        });
    }
}

describe("helper should", () => {
    it("should wait", async () => {
        const h = new History();
        await h.resolve([]);
        h.push("one");
        await h.resolve(["one"]);
        h.push("two", "three");
        await h.reject(["two"], true);
        await h.resolve(["three"]);
        setTimeout(() => {
            h.push("four")
        }, 100);
        await h.resolve(["four"]);
    })
})
