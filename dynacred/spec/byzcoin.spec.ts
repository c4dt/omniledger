import { BCTestEnv } from "spec/simul/itest";
import { HistoryObs } from "spec/support/historyObs";

describe("ByzCoin should", () => {
    it("listen for new blocks", async () => {
        const bct = await BCTestEnv.start();

        const history = new HistoryObs();
        (await bct.bc.getNewBlocks()).subscribe(
            {
                next: (b) => {
                    history.push("block");
                },
            },
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
