import {Log} from "@dedis/cothority";

import {HistoryObs} from "spec/support/historyObs";
import {BCTestEnv} from "spec/simul/itest";
import {KeyPair} from "src/keypair";

describe("using real byzcoin, it should", () => {
    it("listen for new blocks", async () => {
        const bct = await BCTestEnv.start();

        const history = new HistoryObs();
        (await bct.bc.getNewBlocks()).subscribe(
            {
                next: (b) => {
                    history.push("block");
                }
            }
        );
        await bct.user.executeTransactions((tx) => {
            bct.user.credStructBS.credPublic.email.setValue(tx, "as@as.as");
        });
        await history.resolve(["block"]);
        await bct.user.executeTransactions((tx) => {
            bct.user.credStructBS.credPublic.email.setValue(tx, "as2@as.as");
        });
        await history.resolve(["block"]);
    });

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
    })
});
