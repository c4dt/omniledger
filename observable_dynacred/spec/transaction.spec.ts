import {BCTestEnv} from "spec/simul/itest";
import {CoinBS} from "src/coinBS";
import {DarcBS} from "src/darcsBS";
import {CoinInstance} from "@dedis/cothority/byzcoin/contracts";

describe("Transactions should", () => {
    let bcTestEnv: BCTestEnv;

    beforeAll(async () => {
        bcTestEnv = await BCTestEnv.start();
    });

    it("spawn things", async () => {
        if (!bcTestEnv){return}

        const signerDarcID = bcTestEnv.user.credSignerBS.getValue().getBaseID();
        const tx = bcTestEnv.user.startTransaction();
        const coinType = Buffer.from("mycoin");
        const coinIDPreHash1 = Buffer.alloc(32);
        coinIDPreHash1.write("coinID 1");
        const coinIDPreHash2 = Buffer.alloc(32);
        coinIDPreHash2.write("coinID 2");
        const coin1 = tx.spawnCoin(coinType, signerDarcID, coinIDPreHash1);
        const coin2 = tx.spawnCoin(coinType, signerDarcID, coinIDPreHash2);
        const d = tx.spawnDarcBasic("darc 1");
        await tx.send(1);

        const coinInst1 = await CoinBS.getCoinBS(bcTestEnv.user, coin1.id);
        const coinInst2 = await CoinBS.getCoinBS(bcTestEnv.user, coin2.id);
        const darcInst = await DarcBS.createDarcBS(bcTestEnv.user, d.getBaseID());

        expect(coinInst1.getValue().id).toEqual(CoinInstance.coinIID(coinIDPreHash1));
        expect(coinInst2.getValue().id).toEqual(CoinInstance.coinIID(coinIDPreHash2));
        expect(darcInst.getValue().description.toString()).toEqual("darc 1");
    });
});
