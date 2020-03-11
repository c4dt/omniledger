import {CoinInstance} from "@dedis/cothority/byzcoin/contracts";

import {BCTestEnv} from "spec/simul/itest";

describe("Transactions should", () => {
    it("spawn things", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("new Transactions");

        const signerDarcID = user.credSignerBS.getValue().getBaseID();
        const tx = user.startTransaction();
        const coinType = Buffer.from("mycoin");
        const coinIDPreHash1 = Buffer.alloc(32);
        coinIDPreHash1.write("coinID 1");
        const coinIDPreHash2 = Buffer.alloc(32);
        coinIDPreHash2.write("coinID 2");
        const coin1 = tx.spawnCoin(coinType, signerDarcID, coinIDPreHash1);
        const coin2 = tx.spawnCoin(coinType, signerDarcID, coinIDPreHash2);
        const d = tx.spawnDarcBasic("darc 1", [user.kiSigner]);
        await tx.sendCoins(10);

        const coinInst1 = await user.retrieveCoinBS(coin1.id);
        const coinInst2 = await user.retrieveCoinBS(coin2.id);
        const darcInst = await user.retrieveDarcBS(d.getBaseID());

        expect(coinInst1.getValue().id).toEqual(CoinInstance.coinIID(coinIDPreHash1));
        expect(coinInst2.getValue().id).toEqual(CoinInstance.coinIID(coinIDPreHash2));
        expect(darcInst.getValue().description.toString()).toEqual("darc 1");
    });
});
