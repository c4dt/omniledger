import {filter, first} from "rxjs/operators";

import {IdentityDarc, SignerEd25519} from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";

import {KeyPair} from "src/keypair";

import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";

describe("Signers should", () => {
    it("should add and remove devices", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("add remove devices");

        const history = new HistoryObs();
        user.credSignerBS.devices.getOHO().subscribe(
            devs => {
                history.push("new:" +
                    devs.map(dev => dev.getValue().getValue().description.toString()).join("--"));
            }
        );
        await history.resolve(["new:device:initial"]);

        // Stress-test the system - this broke previously.
        for (let i = 0; i < 2; i++) {
            Log.lvl2("creating darc", i);
            const kp = KeyPair.rand();
            await user.executeTransactions(tx => {
                user.credSignerBS.devices.create(tx, "test" + i, [kp.signer()])
            });
            await history.resolve(["new:device:test" + i]);
        }
    });

    it("create and remove devices", async () => {
        const bct = await BCTestEnv.start();
        const history = new HistoryObs();
        const user = await bct.createUser("crdev");

        user.credSignerBS.devices.getOHO().subscribe(devs => {
            devs.forEach(dev => history.push(`${dev.getValue().getValue().description.toString()}`))
        });
        await history.resolve(["device:initial"]);

        const kp = KeyPair.rand();
        await user.executeTransactions(tx => {
            user.credSignerBS.devices.create(tx, "new", [kp.signer()]);
        });

        await history.resolve(["device:new"]);
    });

    it("be able to use recoveries", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("use_recs");
        const other = await bct.createUser("recoverer");

        Log.lvl2("Creating group");
        await user.executeTransactions(tx => {
            const group = user.addressBook.groups.create(tx, "recGroup", [other.identityDarcSigner]);
            const groupID = new IdentityDarc({id: group.getBaseID()});
            user.credSignerBS.recoveries.create(tx, "newDev", [groupID]);
        }, 10);

        // Wait for recovery to arrive
        await user.credSignerBS.recoveries.pipe(filter(recs => recs.length === 1), first()).toPromise();

        Log.lvl2("Creating recovery user and signing up for recovery");
        // Recover user
        const cSign = await bct.getCredentialSignerBS(user.credStructBS);
        const eph = SignerEd25519.random();
        await other.executeTransactions(tx => {
            cSign.devices.create(tx, "recovered", [eph]);
        }, 10);

        // Wait for new device to arrive
        await user.credSignerBS.devices.pipe(filter(devs => devs.length === 2), first()).toPromise();

        Log.lvl2("Do the recovery into a new user");
        const recovered = await bct.getUser(user.credStructBS.id, eph.secret.marshalBinary(), "newMain");
        await recovered.credSignerBS.devices.pipe(filter(devs => devs.length === 2), first()).toPromise();
        Log.lvl2("Change the name");
        // Change the name
        await recovered.executeTransactions(tx => recovered.credStructBS.credPublic.alias.setValue(tx, "recovered"));
        await user.credStructBS.credPublic.alias.pipe(filter(a => a === "recovered"), first()).toPromise();

        Log.lvl2("Remove old device and confirm name-change is impossible");
        await recovered.executeTransactions(tx => {
            recovered.credSignerBS.devices.unlink(tx, "initial");
        });
        await recovered.credSignerBS.devices.pipe(filter(devs => devs.length === 1), first()).toPromise();
        if (bct.bcSimul) {
            Log.lvl2("simulation doesn't verify darcs...");
        } else {
            await expectAsync(user.executeTransactions(tx =>
                user.credStructBS.credPublic.alias.setValue(tx, "newName"), 10))
                .toBeRejected();
        }
    })
});
