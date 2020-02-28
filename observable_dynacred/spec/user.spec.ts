import {IMigrate, User} from "src/user";

import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";

describe("User class should", () => {
    let bcTestEnv: BCTestEnv;

    beforeAll(async () => {
        bcTestEnv = await BCTestEnv.start();
    });

    it("setting up of a new user in testing", async () => {
        if (!bcTestEnv){return}
        const {user} = bcTestEnv;

        await user.save();
        const user2 = await User.load(user);
        expect(user2.kpp).toEqual(user.kpp);
        expect(user2.credStructBS.id).toEqual(user.credStructBS.id);
    });

    it("reading, writing, updating values of new user", async () => {
        if (!bcTestEnv){return}
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
        if (!bcTestEnv){return}
        const {db, user} = bcTestEnv;

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
    })
});
