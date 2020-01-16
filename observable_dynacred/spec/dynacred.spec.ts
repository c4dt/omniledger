import {ByzCoinSimul} from "../src/byzcoin-simul";
import {Instances} from "../src/instances";
import {TempDB} from "../src/tempdb";
import {User} from "../src/user";

describe("pony-world example", () => {
    it("setting up of a new user in testing", async () => {
        const db = new TempDB();
        const bc = new ByzCoinSimul();
        const instances = Instances.fromScratch(bc);
        // const net = Network.fromScratch(instances);
        const test = await bc.newTest("alias", db, instances);
        if (test.user.credID === undefined){
            throw new Error("user.credID shouldn't be undefined");
        }
        const user = new User(db, instances, test.user.keyPair, test.user.credID);
        await user.save();
        const user2 = await User.load(db, instances);
        expect(user2).toEqual(user);
    });
});
