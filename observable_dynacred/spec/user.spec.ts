import {IMigrate, User} from "src/user";

import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";
import {Log} from "@dedis/cothority";

describe("User class should", () => {
    it("setting up of a new user in testing", async () => {
        const {dt, user} = await BCTestEnv.simul();
        await user.save();
        const user2 = await User.load(dt);
        expect(user2.dt.kp).toEqual(user.dt.kp);
        expect(user2.csbs.id).toEqual(user.csbs.id);
    });

    it("reading, writing, updating values of new user", async () => {
        const {user} = await BCTestEnv.simul();
        const alias = user.csbs.credPublic.alias;
        const email = user.csbs.credPublic.email;
        const history = new HistoryObs();
        const obs1 = alias.subscribe((alias) => history.push("alias:" + alias));
        await history.resolve(["alias:alias"]);

        const obs2 = email.subscribe((email) => history.push("email:" + email));
        await history.resolve(["email:"]);

        await alias.setValue("alias2");
        await history.resolve(["alias:alias2"]);

        await alias.setValue("alias3");
        await email.setValue("test@test.com");
        await history.resolve(["alias:alias3", "email:test@test.com"]);
        obs1.unsubscribe();
        obs2.unsubscribe();

        alias.subscribe((alias) => history.push("alias2:" + alias));
        await alias.setValue("alias2");
        await history.resolve(["alias2:alias3", "alias2:alias2"]);
    });

    it("correctly migrate", async () => {
        const {dt, db, inst, user, test} = await BCTestEnv.simul();
        User.migrateOnce = true;

        await db.set(User.keyPriv, Buffer.alloc(0));
        await expectAsync(User.load(dt)).toBeRejected();

        const migrate: IMigrate = {
            keyIdentity: user.dt.kp.priv.marshalBinary().toString("hex"),
            version: User.versionMigrate,
            contact: {
                credential: test.user.cred.toBytes()
            }
        };
        await db.setObject(User.keyMigrate, migrate);
        await expectAsync(User.load(dt)).toBeResolved();

        const mig = await db.get(User.keyMigrate);
        expect(mig).toBeDefined();
        if (mig) {
            expect(mig.length).toBe(0);
        }
        await expectAsync(User.load(dt)).toBeResolved();

        await db.set(User.keyPriv, Buffer.alloc(0));
        await expectAsync(User.load(dt)).toBeRejected();

        migrate.version--;
        await db.setObject(User.keyMigrate, migrate);
        await expectAsync(User.load(dt)).toBeRejected();
    })
});
