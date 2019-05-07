import { Log } from "@c4dt/cothority/log";
import Long from "long";
import { Data, TestData } from "../lib/Data";
import { Defaults } from "../lib/Defaults";
import { KeyPair } from "../lib/KeyPair";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe("Testing new signup", () => {
    describe("With Byzcoin", async () => {
        let tdAdmin: TestData;

        beforeAll(async () => {
            Log.lvl1("Creating Byzcoin and first instance");
            tdAdmin = await TestData.init(Defaults.Roster, "admin");
        });

        it("Creating new user from darc", async () => {
            const kp1 = new KeyPair();
            const user1 = await tdAdmin.createUser("user1", kp1._private);
            await tdAdmin.coinInstance.transfer(Long.fromNumber(1e6), user1.coinInstance.id,
                [tdAdmin.keyIdentitySigner]);
            const kp2 = new KeyPair();
            const user2 = await user1.createUser("user2", kp2._private);
            await user1.coinInstance.transfer(Long.fromNumber(1e5), user2.coinInstance.id,
                [user1.keyIdentitySigner]);
            await user1.coinInstance.update();
            await user2.coinInstance.update();
            // -1500 is for the spawning cost of a new user
            expect(user1.coinInstance.coin.value.toNumber()).toBe(1e6 - 1e5 - 1500);
            expect(user2.coinInstance.coin.value.toNumber()).toBe(1e5);
        });

        it("update the credential of the admin", async () => {
            tdAdmin.contact.email = "admin@user.com";
            await tdAdmin.contact.sendUpdate();
        });

        it("change the private key for a new user", async () => {
            const user1 = await tdAdmin.createUser("user1");
            Log.lvl1("creating empty data structure");
            const user1Copy = new Data();
            user1Copy.bc = user1.bc;
            // Log.lvl1('attaching to it');
            await user1Copy.attachAndEvolve(user1.keyIdentity._private);

            // It should not be possible to attach to it a second time.
            Log.lvl1("trying to attach again");
            const user1Copy2 = new Data();
            user1Copy2.bc = user1.bc;
            await expectAsync(user1Copy2.attachAndEvolve(user1.keyIdentity._private)).toBeRejected();
        });
    });
});
