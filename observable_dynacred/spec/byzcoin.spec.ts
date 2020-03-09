import {HistoryObs} from "spec/support/historyObs";
import {BCTestEnv} from "spec/simul/itest";

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
});
