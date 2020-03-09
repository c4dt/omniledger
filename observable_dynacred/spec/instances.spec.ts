import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";
import {Log} from "@dedis/cothority";
import {Instances} from "observable_dynacred";
import {Argument, ClientTransaction, Instruction} from "@dedis/cothority/byzcoin";
import {CredentialsInstance} from "@dedis/cothority/byzcoin/contracts";

describe("Instances should", () => {
    it("not ask new proofs when not necessary", async () => {
        const bct = await BCTestEnv.start();
        const bcSimul = bct.bcSimul;
        if (!bcSimul) {
            return;
        }

        const user = await bct.createUser("migrate");
        const history = new HistoryObs();
        // Wait for all proofs to be made
        await new Promise(resolve => user.credStructBS.credPublic.alias.subscribe(resolve));
        bcSimul.getProofObserver.subscribe(() => history.push("P"));

        Log.lvl2("Creating new instances object - there should be only one" +
            " getProof");
        const inst2 = await Instances.fromScratch(user.db, bcSimul);
        await inst2.reload();
        await history.resolveAll(["P"]);
        const io2 = (await inst2.instanceBS(user.credStructBS.id)).subscribe(() => history.push("i2"));
        await history.resolve(["i2"]);
        io2.unsubscribe();

        Log.lvl2("Changing the config-instance, new instances object should" +
            " request proof for new instance");
        await bcSimul.sendTransactionAndWait(new ClientTransaction({
            instructions: [
                Instruction.createInvoke(user.credStructBS.id, CredentialsInstance.contractID,
                    CredentialsInstance.commandUpdate, [
                        new Argument({
                            name: CredentialsInstance.argumentCredential,
                            value: user.credStructBS.getValue().toBytes()
                        })
                    ])]
        }));
        const inst3 = await Instances.fromScratch(user.db, bcSimul);
        await inst3.reload();
        await history.resolveAll(["P"]);
        const io3 = (await inst3.instanceBS(user.credStructBS.id)).subscribe(
            (ii) => history.push("i3:" + ii.version.toNumber()));
        await history.resolve(["i3:1"]);
        io3.unsubscribe();
    });
});
