import Log from "@dedis/cothority/log";
import Long from "long";
import { Data } from "src/Data";
import { KeyPair } from "src/KeyPair";
import { StorageLocalStorage } from "src/Storage";
import { TestData } from "src/test-data";
import { TData } from "./support/tdata";

describe("Data class should", async () => {
    let tdAdmin: TestData;

    beforeAll(async () => {
        Log.lvl1("Creating Byzcoin and first instance");
        try {
            tdAdmin = await TData.init();
        } catch (e) {
            return Log.rcatch(e);
        }
        Log.lvl2("Done creating instance");
    });

    it("load old user", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user1Copy = await Data.load(tdAdmin.bc, StorageLocalStorage, user1.dataFileName);
        expect(user1Copy.contact.credentialIID).toEqual(user1.contact.credentialIID);
        expect(user1Copy.toObject()).toEqual(user1.toObject());
    });

    it("keep contacts on skipchain", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user2 = await tdAdmin.createTestUser("user2");
        user1.addContact(user2.contact);
        await user1.save();
        const user1Copy = await Data.load(tdAdmin.bc, StorageLocalStorage, user1.dataFileName);
        expect(user1Copy.contacts.length).toEqual(1);
        expect(user1Copy.toObject()).toEqual(user1.toObject());
        await user1Copy.contacts[0].getInstances();
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
        expect(user1.coinInstance.value.toNumber()).toBe(2e6 - 1e5 - 1500);
        expect(user2.coinInstance.value.toNumber()).toBe(1e5);
    });

    it("allow many contacts", async () => {
        for (let i = 0; i < 10; i++) {
            Log.lvl1("Adding contact", i);
            const d = await tdAdmin.createUser("alias" + i);
            d.contact.email = "test@test.com";
            d.addContact(tdAdmin.contact);
            tdAdmin.addContact(d.contact);
            Log.lvl3("Credential-size is:", tdAdmin.contact.credential.toBytes().length);
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
        const user1Copy = new Data(tdAdmin.bc);
        // Log.lvl1('attaching to it');
        await user1Copy.attachAndEvolve(user1.keyIdentity._private);

        // It should not be possible to attach to it a second time.
        Log.lvl1("trying to attach again");
        const user1Copy2 = new Data(tdAdmin.bc);
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

        const userCopy = await Data.load(tdAdmin.bc, StorageLocalStorage, user.dataFileName);
        expect(userCopy.contact.calypso.ours.size).toBe(1);
    });

    it("spawn to another device correctly and works with Data.overwrite", async () => {
        const device1 = await tdAdmin.createTestUser("user1");

        const deviceURL = await device1.contact.createDevice("newdevice");
        await device1.save();
        const device2 = await Data.attachDevice(tdAdmin.bc, deviceURL);
        device2.storage = StorageLocalStorage;
        expect(device2.contact.credentialIID).toEqual(device1.contact.credentialIID);
        expect(device2.contact.credential).toEqual(device1.contact.credential);
        expect(device2.contact.credential.toJSON()).toEqual(device1.contact.credential.toJSON());
        expect(device2.contact.credential.toBytes()).toEqual(device1.contact.credential.toBytes());

        let balance = device2.coinInstance.value;
        await device2.coinInstance.transfer(Long.fromNumber(1000), tdAdmin.coinInstance.id,
            [device2.keyIdentitySigner]);
        balance = balance.sub(1000);
        await device2.coinInstance.update();
        expect(device2.coinInstance.value.toNumber()).toBe(balance.toNumber());
        await device1.coinInstance.update();
        expect(device1.coinInstance.value.toNumber()).toBe(balance.toNumber());
        await device2.save();

        const device2copy = await Data.load(tdAdmin.bc, StorageLocalStorage, device2.dataFileName);
        await device2copy.coinInstance.transfer(Long.fromNumber(1000), tdAdmin.coinInstance.id,
            [device2copy.keyIdentitySigner]);
        balance = balance.sub(1000);
        await device2copy.coinInstance.update();
        expect(device2copy.coinInstance.value.toNumber()).toBe(balance.toNumber());
        await device1.coinInstance.update();
        expect(device1.coinInstance.value.toNumber()).toBe(balance.toNumber());
        await device2copy.save();
    });

    it("keep calypso-data decoded", async () => {
        // const secretData = Buffer.from("very secret data");
        // const userSecret = await tdAdmin.createTestUser("secret");
        // const device1Signer = await device1.contact.getDarcSignIdentity();
        // await userSecret.contact.calypso.add(secretData, [device1Signer.id]);
        // await device1.contact.calypso.read(userSecret.contact);
    });

    it("create a device from a device", async () => {
        const device1 = await tdAdmin.createTestUser("user1");
        const device2 = await Data.attachDevice(tdAdmin.bc, await device1.contact.createDevice("newdevice"));
        const device3 = await Data.attachDevice(tdAdmin.bc, await device2.contact.createDevice("newdevice2"));
        expect(device3.contact.credentialIID).toEqual(device1.contact.credentialIID);
    });

    it("remove a device", async () => {
        const device1 = await tdAdmin.createTestUser("user1");
        const device2 = await Data.attachDevice(tdAdmin.bc, await device1.contact.createDevice("newdevice"));
        await device1.coinInstance.transfer(Long.fromNumber(100), tdAdmin.coinInstance.id,
            [device1.keyIdentitySigner]);
        await device1.coinInstance.update();
        await device2.contact.deleteDevice("initial");
        await expectAsync(device1.coinInstance.transfer(Long.fromNumber(100), tdAdmin.coinInstance.id,
            [device1.keyIdentitySigner])).toBeRejected();
        await device1.coinInstance.update();
    });
});
