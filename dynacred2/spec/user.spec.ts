import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";
import {KeyPair} from "dynacred2";
import {filter, first} from "rxjs/operators";

import Log from "@dedis/cothority/log";
import {Darc} from "@dedis/cothority/darc";

import {User} from "src/user";
import {IMigrate} from "src/builder";

describe("User class should", async () => {
    it("save and load a user", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("new user");

        await user.save();
        const user2 = await bct.retrieveUserByDB(user.dbBase);
        expect(user2.kpp).toEqual(user.kpp);
        expect(user2.credStructBS.id).toEqual(user.credStructBS.id);
    });

    it("correctly migrate", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("migrate");
        const db = bct.db;

        const dbKP = `main:${User.keyPriv}`;

        await db.set(dbKP, Buffer.alloc(0));
        await expectAsync(bct.retrieveUserByDB()).toBeRejected();

        const migrate: IMigrate = {
            keyIdentity: user.kpp.priv.marshalBinary().toString("hex"),
            version: User.versionMigrate,
            contact: {
                credential: user.credStructBS.getValue().toBytes()
            }
        };
        await db.set(User.keyMigrate, Buffer.from(JSON.stringify(migrate)));
        expect(await bct.migrateUser(db)).toBeTruthy();
        const newUser = await bct.retrieveUserByDB();
        expect(newUser.credStructBS.credPublic.alias.getValue()).toBe("migrate");

        await db.set(dbKP, Buffer.alloc(0));
        await expectAsync(bct.retrieveUserByDB()).toBeRejected();

        migrate.version--;
        await db.set(User.keyMigrate, Buffer.from(JSON.stringify(migrate)));
        await expectAsync(bct.retrieveUserByDB()).toBeRejected();
    });

    it("connect to a new device", async () => {
        const bct = await BCTestEnv.start();
        const nu = await bct.createUser("newUser");

        const h = new HistoryObs();
        nu.credStructBS.credPublic.alias.subscribe(a => h.push(a));
        await h.resolve(["newUser"]);

        Log.lvl2('adding device');
        const tx = nu.startTransaction();
        const ephemeralIdentity = KeyPair.rand().signer();
        Log.lvl2("Signer / private is:", ephemeralIdentity, ephemeralIdentity.secret.marshalBinary());
        nu.credSignerBS.devices.create(tx, "newDevice", [ephemeralIdentity]);
        await tx.sendCoins(10);
        // This is needed to make sure that everything is updated locally.
        await nu.credSignerBS.pipe(
            filter(d => d.rules.getRule(Darc.ruleSign).getIdentities().length == 2),
            first()
        ).toPromise();
        await nu.credStructBS.credDevices.pipe(filter(im => im.map.size == 2), first()).toPromise();

        Log.lvl2("connecting to new device", ephemeralIdentity.secret);
        const nu2 = await bct.retrieveUserByURL(nu.getUrlForDevice(ephemeralIdentity.secret));
        nu2.credStructBS.credPublic.alias.subscribe(a => h.push(a));
        await h.resolve(["newUser"]);

        await nu2.executeTransactions(tx => {
            nu2.credStructBS.credPublic.alias.setValue(tx, "newDevice2");
        }, 10);

        await h.resolve(["newDevice2", "newDevice2"]);
    })
});
