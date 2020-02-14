import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";
import {ByzCoinSimul} from "spec/simul/byzcoinSimul";
import {byzcoin, Log} from "@dedis/cothority";
import {Instances} from "observable_dynacred";

const {CredentialStruct, CredentialsInstance} = byzcoin.contracts;
const {ClientTransaction, Instruction, Argument} = byzcoin;

describe("Instances should", () => {
    it("should not ask new proofs when not necessary", async () => {
        const {bc, db, inst, user} = await BCTestEnv.simul();
        const history = new HistoryObs();
        // Wait for all proofs to be made
        await new Promise(resolve => user.csbs.credPublic.alias.subscribe(resolve));
        (bc as ByzCoinSimul).getProofObserver.subscribe(() => history.push("P"));

        Log.lvl2("Creating new instances object - there should be only one" +
            " getProof");
        const inst2 = await Instances.fromScratch(db, bc);
        await inst2.reload();
        await history.resolve(["P", "P"]);
        const io2 = (await inst2.instanceObservable(user.csbs.id)).subscribe(() => history.push("i2"));
        await history.resolve(["i2"]);
        io2.unsubscribe();

        Log.lvl2("Changing the config-instance, new instances object should" +
            " request proof for new instance");
        await bc.sendTransactionAndWait(new ClientTransaction({
            instructions: [
                Instruction.createInvoke(user.csbs.id, CredentialsInstance.contractID,
                    CredentialsInstance.commandUpdate, [
                        new Argument({
                            name: CredentialsInstance.argumentCredential,
                            value: user.csbs.getValue().toBytes()
                        })
                    ])]
        }));
        const inst3 = await Instances.fromScratch(db, bc);
        await inst3.reload();
        await history.resolve(["P", "P", "P", "P", "P"]);
        const io3 = (await inst3.instanceObservable(user.csbs.id)).subscribe(
            (ii) => history.push("i3:" + ii.version.toNumber()));
        await history.resolve(["i3:1"]);
        io3.unsubscribe();
    });
});
