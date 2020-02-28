import {Log} from "@dedis/cothority";

import {HistoryObs} from "spec/support/historyObs";
import {BCTestEnv} from "spec/simul/itest";
import {KeyPair} from "src/keypair";

describe("using real byzcoin, it should", () => {
    let bcTestEnv: BCTestEnv;

    beforeAll(async () => {
        bcTestEnv = await BCTestEnv.start();
    });

    it("listen for new blocks", async () => {
        if (!bcTestEnv){return}

        const history = new HistoryObs();
        (await bcTestEnv.bc.getNewBlocks()).subscribe(
            {
                next: (b) => {
                    history.push("block");
                }
            }
        );
        await bcTestEnv.user.executeTransactions((tx) => {
            bcTestEnv.user.credStructBS.credPublic.email.setValue(tx, "as@as.as");
        });
        await history.resolve(["block"]);
        await bcTestEnv.user.executeTransactions((tx) => {
            bcTestEnv.user.credStructBS.credPublic.email.setValue(tx, "as2@as.as");
        });
        await history.resolve(["block"]);
    });

    it("should add and remove devices", async () => {
        if (!bcTestEnv){return}

        const history = new HistoryObs();
        bcTestEnv.user.credSignerBS.devices.getOHO(bcTestEnv.user).subscribe(
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
            await bcTestEnv.user.executeTransactions(tx => {
                bcTestEnv.user.credSignerBS.devices.create(tx, "test" + i, [kp.signer()])
            });
            await history.resolve(["new:device:test" + i]);
        }
    })
});
