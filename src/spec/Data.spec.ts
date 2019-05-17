import { ed25519 } from "@dedis/cothority/personhood/ring-sig";
import Log from "@dedis/cothority/log";
import Long from "long";
import { Data, TestData } from "src/lib/Data";
import { KeyPair } from "src/lib/KeyPair";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe("Data class should", async () => {
    let tdAdmin: TestData;

    beforeAll(async () => {
        Log.lvl1("Creating Byzcoin and first instance");
        try {
            tdAdmin = await TestData.init();
        } catch(e){
            return Log.rcatch(e);
        }
        Log.lvl2("Done creating instance");
    });

    it("load old user", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user1Copy = new Data();
        user1Copy.dataFileName = user1.dataFileName;
        await user1Copy.load();
        expect(user1Copy.contact.credentialIID).toEqual(user1.contact.credentialIID);
        expect(user1Copy.toObject()).toEqual(user1.toObject());
    });

    it("keep contacts on skipchain", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user2 = await tdAdmin.createTestUser("user2");
        user1.addContact(user2.contact);
        await user1.save();
        const user1Copy = new Data();
        user1Copy.dataFileName = user1.dataFileName;
        await user1Copy.load();
        expect(user1Copy.contacts.length).toEqual(1);
        expect(user1Copy.toObject()).toEqual(user1.toObject());
        expect(user1Copy.contacts[0].coinInstance).toBeDefined();
    });

    it("create new user from darc", async () => {
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
        // -1500 is for the spawning cost of a new user, each new user get 1e6.
        expect(user1.coinInstance.coin.value.toNumber()).toBe(2e6 - 1e5 - 1500);
        expect(user2.coinInstance.coin.value.toNumber()).toBe(1e5);
    });

    it("allow many contacts", async () => {
        for (let i = 0; i < 10; i++) {
            Log.lvl1("Adding contact", i);
            const d = await tdAdmin.createUser("alias" + i);
            d.contact.email = "test@test.com";
            d.addContact(tdAdmin.contact);
            tdAdmin.addContact(d.contact);
            Log.print("Credential-size is:", tdAdmin.contact.credential.toBytes().length);
            await tdAdmin.save();
            // Wait for block to be propagated
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 500);
            });
        }
    });

    it("update the credential of the admin", async () => {
        tdAdmin.contact.email = "admin@user.com";
        await tdAdmin.contact.sendUpdate();
    });

    it("change the private key for a new user", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        user1.addContact(tdAdmin.contact);
        await user1.save();
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

    it("spawn to another device correctly", async () => {
        const device1 = await tdAdmin.createTestUser("user1");

        const deviceURL = await device1.createDevice();
        const device2 = await Data.attachDevice(deviceURL);
        expect(device2.contact.credentialIID).toEqual(device1.contact.credentialIID);
        expect(device2.contact.credential.toBytes()).toEqual(device1.contact.credential.toBytes());
        let balance = device2.coinInstance.coin.value;
        await device2.coinInstance.transfer(Long.fromNumber(1000), tdAdmin.coinInstance.id,
            [device2.keyIdentitySigner]);
        balance = balance.sub(1000);
        await device2.coinInstance.update();
        expect(device2.coinInstance.coin.value.toNumber()).toBe(balance.toNumber());
        await device1.coinInstance.update();
        expect(device1.coinInstance.coin.value.toNumber()).toBe(balance.toNumber());

        const secretData = Buffer.from("very secret data");
        const userSecret = await tdAdmin.createTestUser("secret");
        const device1Signer = await device1.contact.getDarcSignIdentity();
        await userSecret.contact.calypso.add(secretData, [device1Signer.id]);
        await device1.contact.calypso.read(userSecret.contact);

    });
});
