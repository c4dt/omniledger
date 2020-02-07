import {BCTestEnv} from "spec/simul/itest";
import {IMigrate, User} from "src/user";
import {KeyPair} from "src/keypair";

describe("User class should", () => {
    it("correctly migrate", async () => {
        const {bc, db, inst, user, test} = await BCTestEnv.simul();

        await db.set(User.keyPriv, Buffer.alloc(0));
        await expectAsync(User.load(db, inst)).toBeRejected();

        const migrate: IMigrate = {
            keyIdentity: user.kp.priv.marshalBinary().toString("hex"),
            version: User.versionMigrate,
            contact: {
                credential: test.user.cred.toBytes()
            }
        };
        await db.setObject(User.keyMigrate, migrate);
        await expectAsync(User.load(db, inst)).toBeResolved();

        const mig = await db.get(User.keyMigrate);
        expect(mig).toBeDefined();
        if (mig) {
            expect(mig.length).toBe(0);
        }
        await expectAsync(User.load(db, inst)).toBeResolved();

        await db.set(User.keyPriv, Buffer.alloc(0));
        await expectAsync(User.load(db, inst)).toBeRejected();

        migrate.version--;
        await db.setObject(User.keyMigrate, migrate);
        await expectAsync(User.load(db, inst)).toBeRejected();

        const kph = KeyPair.rand();
        migrate.version++;
        migrate.keyPersonhood = kph.priv.marshalBinary().toString("hex");
        await db.setObject(User.keyMigrate, migrate);

        const u = await User.load(db, inst);
        expect(u.kpPersonhood).toBeDefined();
        if (u.kpPersonhood) {
            expect(u.kpPersonhood.toString()).toBe(kph.toString());
        }
    })
});
