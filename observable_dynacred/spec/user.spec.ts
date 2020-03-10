import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";
import {KeyPair} from "observable_dynacred";
import {filter, first} from "rxjs/operators";

import Log from "@dedis/cothority/log";
import {Darc} from "@dedis/cothority/darc";

import {IMigrate, User} from "src/user";

describe("User class should", async () => {
    it("save and load a user", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("new user");

        await user.save();
        const user2 = await bct.getUserFromDB(user.dbBase);
        expect(user2.kpp).toEqual(user.kpp);
        expect(user2.credStructBS.id).toEqual(user.credStructBS.id);
    });

    it("correctly migrate", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("migrate");
        const db = user.db;

        User.migrateOnce = true;

        const dbKP = `main:${User.keyPriv}`;

        await db.set(dbKP, Buffer.alloc(0));
        await expectAsync(bct.getUserFromDB()).toBeRejected();

        const migrate: IMigrate = {
            keyIdentity: user.kpp.priv.marshalBinary().toString("hex"),
            version: User.versionMigrate,
            contact: {
                credential: user.credStructBS.getValue().toBytes()
            }
        };
        await db.setObject(User.keyMigrate, migrate);
        await expectAsync(bct.getUserFromDB()).toBeResolved();

        const mig = await db.get(User.keyMigrate);
        expect(mig).toBeDefined();
        if (mig) {
            expect(mig.length).toBe(0);
        }
        await expectAsync(bct.getUserFromDB()).toBeResolved();

        await db.set(dbKP, Buffer.alloc(0));
        await expectAsync(bct.getUserFromDB()).toBeRejected();

        migrate.version--;
        await db.setObject(User.keyMigrate, migrate);
        await expectAsync(bct.getUserFromDB()).toBeRejected();
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
        await tx.send(10);
        // This is needed to make sure that everything is updated locally.
        await nu.credSignerBS.pipe(
            filter(d => d.rules.getRule(Darc.ruleSign).getIdentities().length == 2),
            first()
        ).toPromise();
        await nu.credStructBS.credDevices.pipe(filter(im => im.map.size == 2), first()).toPromise();

        Log.lvl2("connecting to new device", ephemeralIdentity.secret);
        const nu2 = await bct.getUserFromURL(nu.getUrlForDevice(ephemeralIdentity.secret));
        nu2.credStructBS.credPublic.alias.subscribe(a => h.push(a));
        await h.resolve(["newUser"]);

        await nu2.executeTransactions(tx => {
            nu2.credStructBS.credPublic.alias.setValue(tx, "newDevice2");
        }, 10);

        await h.resolve(["newDevice2", "newDevice2"]);
    })
});
