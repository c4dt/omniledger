import { filter, first } from "rxjs/operators";

import { Darc, IdentityDarc, SignerEd25519 } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";

import { KeyPair } from "src/keypair";

import { Migrate } from "dynacred";
import { BCTestEnv, simul } from "spec/simul/itest";
import { HistoryObs } from "spec/support/historyObs";

describe("Signers should", () => {
    it("add and remove devices", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("add remove devices");

        const history = new HistoryObs();
        user.credSignerBS.devices.subscribe(
            (devs) => {
                history.push("new:" +
                    devs.map((dev) => dev.getValue().description.toString()).join("--"));
            },
        );
        await history.resolve(["new:device:initial"]);

        // Stress-test the system - this broke previously.
        let newStr = "new:device:initial";
        for (let i = 0; i < 2; i++) {
            Log.lvl2("creating darc", i);
            const kp = KeyPair.rand();
            await user.executeTransactions((tx) => {
                user.credSignerBS.devices.create(tx, "test" + i, [kp.signer()]);
            });
            newStr += "--device:test" + i;
            await history.resolve([newStr]);
        }
    });

    it("create and remove devices", async () => {
        const bct = await BCTestEnv.start();
        const history = new HistoryObs();
        const user = await bct.createUser("crdev");

        user.credSignerBS.devices.subscribe((devs) => {
            devs.forEach((dev) => history.push(`${dev.getValue().description.toString()}`));
        });
        await history.resolve(["device:initial"]);

        const kp = KeyPair.rand();
        await user.executeTransactions((tx) => {
            user.credSignerBS.devices.create(tx, "new", [kp.signer()]);
        });

        await history.resolve(["device:initial", "device:new"]);
    });

    it("be able to use recoveries", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("use_recs");
        const other = await bct.createUser("recoverer");

        Log.lvl2("Creating group");
        await user.executeTransactions((tx) => {
            const group = user.addressBook.groups.create(tx, "recGroup", [other.identityDarcSigner]);
            const groupID = new IdentityDarc({id: group.getBaseID()});
            user.credSignerBS.recoveries.create(tx, "newDev", [groupID]);
        }, 10);

        // Wait for recovery to arrive
        await user.credSignerBS.recoveries.pipe(filter((recs) => recs.length === 1), first()).toPromise();

        Log.lvl2("Creating recovery user and signing up for recovery");
        // Recover user
        const cSign = await bct.retrieveCredentialSignerBS(user.credStructBS);
        const eph = SignerEd25519.random();
        await other.executeTransactions((tx) => {
            cSign.devices.create(tx, "recovered", [eph]);
        }, 10);

        // Wait for new device to arrive
        await user.credSignerBS.devices.pipe(
            filter((devs) => devs.length === 2), first()).toPromise();

        Log.lvl2("Do the recovery into a new user");
        const recovered = await bct.retrieveUser(user.credStructBS.id, eph.secret.marshalBinary(), "newMain");
        await recovered.credSignerBS.devices.pipe(filter((devs) => devs.length === 2), first()).toPromise();
        Log.lvl2("Change the name");
        // Change the name
        await recovered.executeTransactions((tx) => recovered.credStructBS.credPublic.alias.setValue(tx, "recovered"));
        await user.credStructBS.credPublic.alias.pipe(filter((a) => a === "recovered"), first()).toPromise();

        Log.lvl2("Remove old device and confirm name-change is impossible");
        const initialID = recovered.credSignerBS.devices.find("initial").getValue().getBaseID();
        await recovered.executeTransactions((tx) => {
            recovered.credSignerBS.devices.unlink(tx, initialID);
        });
        await recovered.credSignerBS.devices.pipe(filter((devs) => devs.length === 1), first()).toPromise();
        if (bct.bcSimul) {
            Log.lvl2("simulation doesn't verify darcs...");
        } else {
            await expectAsync(user.executeTransactions((tx) =>
                user.credStructBS.credPublic.alias.setValue(tx, "newName"), 10))
                .toBeRejected();
        }
    });

    it("not allow recoveries to sign", async () => {
        // This is a regression test to make sure that new recoveries cannot sign on behalf of the user.
        if (simul) {
            Log.lvl1("cannot test recovery signature");
            return;
        }
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("use_recs");
        const other = await bct.createUser("recoverer");

        Log.lvl2("Create link as device, which will also be able to sign");
        await user.executeTransactions((tx) => {
            user.credSignerBS.recoveries.link(tx, "recovery", other.identityDarcSigner.id);
        }, 10);
        await other.executeTransactions((tx) =>
            user.credStructBS.credPublic.alias.setValue(tx, "new"), 10);

        Log.lvl2("Create link as recovery, which should not be able to sign");
        await user.executeTransactions((tx) => {
            user.credSignerBS.recoveries.unlink(tx, other.identityDarcSigner.id);
        }, 10);
        // Wait for credSigner to be updated
        await user.credSignerBS.recoveries.pipe(filter((rec) => rec.length === 0), first()).toPromise();
        await user.executeTransactions((tx) => {
            user.credSignerBS.recoveries.link(tx, "recovery", other.identityDarcSigner.id, true);
        }, 10);
        await expectAsync(other.executeTransactions((tx) =>
            user.credStructBS.credPublic.alias.setValue(tx, "new"), 10))
            .toBeRejected();
    });

    it("correctly migrate old recoveries", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("use_recs");
        const other1 = await bct.createUser("recoverer 1");
        const other2 = await bct.createUser("recoverer 2");

        // These cannot be made in the same transaction, else the signer-darc is not updated.
        await user.executeTransactions((tx) =>
            user.credSignerBS.recoveries.link(tx, "old recovery", other1.credSignerBS.getValue().id), 10);
        await user.credSignerBS.pipe(filter((cs) => cs.version.equals(1)), first()).toPromise();

        await user.executeTransactions((tx) =>
            user.credSignerBS.recoveries.link(tx, "new recovery", other2.credSignerBS.getValue().id, true),
            10);
        await user.credSignerBS.pipe(filter((cs) => cs.version.equals(2)), first()).toPromise();

        // Verify we have the correct versions
        const oldRec = user.credSignerBS.recoveries.getValue()[0];
        const newRec = user.credSignerBS.recoveries.getValue()[1];

        expect(Migrate.versionRecovery(user.credSignerBS.getValue(), oldRec)).toBe(0);
        expect(Migrate.versionRecovery(user.credSignerBS.getValue(), newRec)).toBe(1);

        // Update the old to the new version, and try to update the new version.
        await user.executeTransactions((tx) =>
        Migrate.updateRecovery(tx, user.credSignerBS, oldRec), 10);
        await user.executeTransactions((tx) =>
        Migrate.updateRecovery(tx, user.credSignerBS, newRec), 10);

        await user.credSignerBS.pipe(filter((d) => d.version.equals(3)), first()).toPromise();

        expect(Migrate.versionRecovery(user.credSignerBS.getValue(), oldRec)).toBe(1);
        expect(Migrate.versionRecovery(user.credSignerBS.getValue(), newRec)).toBe(1);
    });
});
