import { Darc, IdentityDarc, IdentityWrapper } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";
import { randomBytes } from "crypto";
import Long from "long";
import { Data } from "src";
import { StorageLocalStorage } from "src/Storage";
import { TestData } from "src/test-data";
import { TData } from "./support/tdata";

describe("Contact should", async () => {
    let tdAdmin: TestData;

    beforeAll(async () => {
        try {
            tdAdmin = await TData.init();
        } catch (e) {
            Log.error("couldn't start byzcoin:", e);
        }
    });

    it("create an ocs and store it correctly in a new user", async () => {
        Log.lvl1("starting test");
        const user1 = await tdAdmin.createTestUser("user1");
        expect(user1.contact.ltsID).toEqual(tdAdmin.contact.ltsID);
    });

    it("correctly load cross-linked users", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user2 = await user1.createUser("user2");
        user2.addContact(user1.contact);
        await user2.save();
        user1.addContact(user2.contact);
        await user1.save();
        const user1Copy = await Data.load(tdAdmin.bc, StorageLocalStorage, user1.dataFileName);
        expect(user1.toObject()).toEqual(user1Copy.toObject());
    }, 20000);

    it("convert from old to new contacts", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const contact1 = user1.contact;
        contact1.contactsCache = [tdAdmin.contact];
        const csBuf = Buffer.from(JSON.stringify(contact1.contactsCache.map((c) => c.toObject())));
        contact1.credential.setAttribute("1-public", "contacts", csBuf);
        contact1.structVersion = 1;
        contact1.version = contact1.version + 1;
        await user1.save();
        contact1.contactsCache = [];
        await contact1.updateOrConnect(undefined, true);
        expect(contact1.contacts.length).toBe(1);
        expect(contact1.contacts[0].credentialIID).toEqual(tdAdmin.contact.credentialIID);
        expect(contact1.contacts[0].coinInstance).toBeDefined();
        expect(contact1.credential.getAttribute("1-public", "contacts")).toEqual(Buffer.alloc(0));
        expect(contact1.credential.getAttribute("1-public", "contactsBuf")).not.toEqual(Buffer.alloc(0));
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
        Log.lvl3("contact size is:", user2.contact.credential.toBytes().length);
        expect(sd.length).toBe(1);
        expect(sd[0].plainData).toEqual(data);
    });

    it("keep actions and groups", async () => {
        const nd = await Darc.createBasic([tdAdmin.keyIdentitySigner], [tdAdmin.keyIdentitySigner],
            Buffer.from("desc"));
        const di = await tdAdmin.spawnerInstance.spawnDarcs(tdAdmin.coinInstance, [tdAdmin.keyIdentitySigner], nd);
        tdAdmin.contact.setActions(di);
        await tdAdmin.save();
        expect((await tdAdmin.contact.getActions()).length).toBe(1);
        const userCopy = await Data.load(tdAdmin.bc, StorageLocalStorage, tdAdmin.dataFileName);
        expect((await userCopy.contact.getActions()).length).toBe(1);
    });

    it("find public keys", async () => {
        const user1 = await tdAdmin.createTestUser("user1");
        const user2 = await tdAdmin.createTestUser("user2");

        user1.addContact(user2.contact);
        const dev = await user1.contacts[0].getDevices();
        expect(dev[0].pubKey.equal(user2.keyIdentity._public)).toBeTruthy();

        const dev2url = await user2.createDevice("device2");
        const dev2 = await Data.attachDevice(tdAdmin.bc, dev2url.href);
        const devs = await user1.contacts[0].getDevices();
        expect(devs.length).toBe(2);
        expect(devs[0].pubKey.equal(user2.keyIdentity._public)).toBeTruthy();
        expect(devs[1].pubKey.equal(dev2.keyIdentity._public)).toBeTruthy();
    });

    it("add and remove signer", async () => {
        const darcID = randomBytes(32);

        await expectAsync(tdAdmin.contact.rmSigner("1-devices", darcID)).toBeRejected();
        Log.lvl2("adding signer");
        await tdAdmin.contact.addSigner("1-recovery", "recoverer", darcID, [tdAdmin.keyIdentitySigner]);
        const idDarc = await tdAdmin.contact.getDarcSignIdentity();
        Log.lvl2("checking authorization");
        let authArray = await tdAdmin.bc.checkAuthorization(tdAdmin.bc.genesisID, idDarc.id,
            IdentityWrapper.fromIdentity(new IdentityDarc({id: darcID})));
        expect(authArray.length).toBeGreaterThan(0);
        expect(tdAdmin.contact.credential.getAttribute("1-recovery", "recoverer")).toEqual(darcID);

        Log.lvl2("removing signer");
        await tdAdmin.contact.rmSigner("1-recovery", darcID);
        expect(tdAdmin.contact.credential.getAttribute("1-recovery", "recoverer")).toBeUndefined();
        Log.lvl2("checking authorization");
        authArray = await tdAdmin.bc.checkAuthorization(tdAdmin.bc.genesisID, idDarc.id,
            IdentityWrapper.fromIdentity(new IdentityDarc({id: darcID})));
        expect(authArray.length).toBe(0);
    });
});
