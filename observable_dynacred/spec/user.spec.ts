import Long from "long";

import {IMigrate, User} from "src/user";

import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";
import {KeyPair, UserSkeleton} from "observable_dynacred";
import Log from "@dedis/cothority/log";
import {Darc} from "@dedis/cothority/darc";
import {filter, first, tap} from "rxjs/operators";

describe("User class should", async () => {
    let bcTestEnv: BCTestEnv;

    beforeAll(async () => {
        try {
            bcTestEnv = await BCTestEnv.start();
        } catch (e) {
            Log.catch(e);
        }
    });

    it("setting up of a new user in testing", async () => {
        if (!bcTestEnv) {
            return
        }
        const {user} = bcTestEnv;

        await user.save();
        const user2 = await User.load(user);
        expect(user2.kpp).toEqual(user.kpp);
        expect(user2.credStructBS.id).toEqual(user.credStructBS.id);
    });

    it("reading, writing, updating values of new user", async () => {
        if (!bcTestEnv) {
            return
        }
        const {user} = bcTestEnv;

        const alias = user.credStructBS.credPublic.alias;
        const email = user.credStructBS.credPublic.email;
        const history = new HistoryObs();
        const obs1 = alias.subscribe((alias) => history.push("alias:" + alias));
        await history.resolve(["alias:" + user.credStructBS.credPublic.alias.getValue()]);

        const obs2 = email.subscribe((email) => history.push("email:" + email));
        await history.resolve(["email:"]);

        await user.executeTransactions(tx => {
            alias.setValue(tx, "alias2");
        });
        await history.resolve(["alias:alias2"]);

        await user.executeTransactions(tx => {
            alias.setValue(tx, "alias3");
        });
        await user.executeTransactions(tx => {
            email.setValue(tx, "test@test.com");
        });
        await history.resolve(["alias:alias3", "email:test@test.com"]);
        obs1.unsubscribe();
        obs2.unsubscribe();

        alias.subscribe((alias) => history.push("alias2:" + alias));
        await user.executeTransactions(tx => {
            alias.setValue(tx, "alias2");
        });
        await history.resolve(["alias2:alias3", "alias2:alias2"]);
    });

    it("correctly migrate", async () => {
        if (!bcTestEnv) {
            return
        }
        const {user} = bcTestEnv;
        const db = user.db;

        User.migrateOnce = true;

        const dbKP = `main:${User.keyPriv}`;

        await db.set(dbKP, Buffer.alloc(0));
        await expectAsync(User.load(user)).toBeRejected();

        const migrate: IMigrate = {
            keyIdentity: user.kpp.priv.marshalBinary().toString("hex"),
            version: User.versionMigrate,
            contact: {
                credential: user.credStructBS.getValue().toBytes()
            }
        };
        await db.setObject(User.keyMigrate, migrate);
        await expectAsync(User.load(user)).toBeResolved();

        const mig = await db.get(User.keyMigrate);
        expect(mig).toBeDefined();
        if (mig) {
            expect(mig.length).toBe(0);
        }
        await expectAsync(User.load(user)).toBeResolved();

        await db.set(dbKP, Buffer.alloc(0));
        await expectAsync(User.load(user)).toBeRejected();

        migrate.version--;
        await db.setObject(User.keyMigrate, migrate);
        await expectAsync(User.load(user)).toBeRejected();
    });

    it("connect to a new device", async () => {
        const {user} = bcTestEnv;

        Log.lvl2("creating new user");
        const nuSkel = new UserSkeleton("newUser", user.spawnerInstanceBS.getValue().id);
        await user.executeTransactions(tx => {
            tx.createUser(nuSkel, Long.fromNumber(1e6));
        }, 10);

        Log.lvl2('reading new user');
        const nu = await User.getUser(user, nuSkel.credID, nuSkel.keyPair.priv.marshalBinary(), "newUser");
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
        const nu2 = await User.attachAndEvolveDevice(user, nu.getUrlForDevice(ephemeralIdentity.secret));
        nu2.credStructBS.credPublic.alias.subscribe(a => h.push(a));
        await h.resolve(["newUser"]);

        await nu2.executeTransactions(tx => {
            nu2.credStructBS.credPublic.alias.setValue(tx, "newDevice2");
        }, 10);

        await h.resolve(["newDevice2", "newDevice2"]);
    })
});
