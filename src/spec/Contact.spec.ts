import { newDarc } from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import { Log } from "@c4dt/cothority/log";
import Long from "long";
import { Data, TestData } from "src/lib/Data";
import { activateTesting, Defaults } from "src/lib/Defaults";

// jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe("Contact should", async () => {
    let tdAdmin: TestData;

    beforeAll(async () => {
        try {
            tdAdmin = await TestData.init();
        } catch (e) {
            Log.error("couldn't start byzcoin:", e);
        }
    });

    it("create an ocs and store it correctly in a new user", async () => {
        Log.lvl1("starting test");
        const user1 = await tdAdmin.createTestUser("user1");
        expect(user1.contact.ltsID).toEqual(tdAdmin.contact.ltsID);
    });

    it("create a SecureData and recover it on another user", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        await tdAdmin.coinInstance.transfer(Long.fromNumber(1e6), user1.coinInstance.id, [tdAdmin.keyIdentitySigner]);
        await user1.coinInstance.update();
        const user2 = await tdAdmin.createTestUser("user2");
        await tdAdmin.coinInstance.transfer(Long.fromNumber(1e6), user2.coinInstance.id, [tdAdmin.keyIdentitySigner]);
        await user2.coinInstance.update();
        const data = Buffer.from("very secure data");
        await user1.contact.calypso.add(data, [(await user2.contact.getDarcSignIdentity()).id]);
        const sd = await user2.contact.calypso.read(user1.contact);
        expect(sd.length).toBe(1);
        expect(sd[0].plainData).toEqual(data);
    });

    it("check size of contact", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user2 = await tdAdmin.createTestUser("user2");
        const data = Buffer.alloc(1e5);
        await user1.contact.calypso.add(data, [(await user2.contact.getDarcSignIdentity()).id]);
        const sd = await user2.contact.calypso.read(user1.contact);
        Log.print("contact size is:", user2.contact.credential.toBytes().length);
        expect(sd.length).toBe(1);
        expect(sd[0].plainData).toEqual(data);
    });

    it("keep actions and groups", async () => {
        const userCopy = new Data();
        userCopy.dataFileName = tdAdmin.dataFileName;

        const nd = await newDarc([tdAdmin.keyIdentitySigner], [tdAdmin.keyIdentitySigner],
            Buffer.from("desc"));
        const di = await tdAdmin.spawnerInstance.spawnDarc(tdAdmin.coinInstance, [tdAdmin.keyIdentitySigner], nd);
        tdAdmin.contact.setActions(di);
        await tdAdmin.save();
        expect((await tdAdmin.contact.getActions()).length).toBe(1);
        await userCopy.load();
        expect((await userCopy.contact.getActions()).length).toBe(1);
    });
});
