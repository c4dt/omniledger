import Long from "long";
import { Log } from "@c4dt/cothority/log";
import { Data, TestData } from "src/lib/Data";
import { KeyPair } from "src/lib/KeyPair";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe("Testing new signup", async () => {
    let tdAdmin: TestData;

    beforeAll(async () =>    {
        Log.lvl1("Creating Byzcoin and first instance");
        tdAdmin = await TestData.init();
    });

    it("Should load old user", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user1Copy = new Data();
        user1Copy.dataFileName = user1.dataFileName;
        await user1Copy.load();
        expect(user1Copy.contact.credentialIID).toEqual(user1.contact.credentialIID);
        expect(user1Copy.toObject()).toEqual(user1.toObject());
    });

    it("Should keep contacts on skipchain", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user2 = await tdAdmin.createTestUser("user2");
        user1.addContact(user2.contact);
        await user1.save();
        const user1Copy = new Data();
        user1Copy.dataFileName = user1.dataFileName;
        await user1Copy.load();
        expect(user1Copy.contacts.length).toEqual(1);
        expect(user1Copy.toObject()).toEqual(user1.toObject());
    });

    it("Creating new user from darc", async () => {
        const kp1 = new KeyPair();
        const user1 = await tdAdmin.createTestUser("user1", kp1._private);
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
        const user1 = await tdAdmin.createTestUser("user1");
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

    it("keep a stored secret in Calypso", async () => {
        const user = await tdAdmin.createTestUser("user1");
        await tdAdmin.coinInstance.transfer(Long.fromNumber(100000), user.coinInstance.id,
            [tdAdmin.keyIdentitySigner]);
        await user.coinInstance.update();
        const secret = Buffer.from("Very Secret Data");

        Log.lvl2("Creating Write instance");
        await user.contact.calypso.add(secret, []);
        await user.save();
        expect(user.contact.calypso.ours.size).toBe(1);

        const userCopy = new Data({alias: "user1"});
        userCopy.dataFileName = user.dataFileName;
        await userCopy.load();
        expect(userCopy.contact.calypso.ours.size).toBe(1);
    });
});
