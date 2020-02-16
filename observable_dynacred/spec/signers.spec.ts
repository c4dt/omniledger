import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";
import {KeyPair} from "src/keypair";
import {Log} from "@dedis/cothority";

describe("Signers should", () => {
    it("create and remove devices", async () =>{
        const {user} = await BCTestEnv.simul();
        const history = new HistoryObs();

        user.credSigner.getDevicesOHO().subscribe(devs => {
            devs.forEach(dev => history.push(`${dev.getName()}`))
        });
        await history.resolve(["device:initial"]);

        const kp = KeyPair.rand();
        await user.credSigner.addDevice("new", kp.signer());

        await history.resolve(["device:new"]);
    })
});
