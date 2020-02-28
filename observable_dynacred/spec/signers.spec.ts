import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";
import {KeyPair} from "src/keypair";

describe("Signers should", () => {
    it("create and remove devices", async () =>{
        const {user} = await BCTestEnv.start();
        const history = new HistoryObs();

        user.credSignerBS.devices.getOHO(user).subscribe(devs => {
            devs.forEach(dev => history.push(`${dev.getValue().getValue().description.toString()}`))
        });
        await history.resolve(["device:initial"]);

        const kp = KeyPair.rand();
        await user.executeTransactions(tx => {
            user.credSignerBS.devices.create(tx, "new", [kp.signer()]);
        });

        await history.resolve(["device:new"]);
    })
});
