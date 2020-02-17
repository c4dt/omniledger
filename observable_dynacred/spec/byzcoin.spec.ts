import {Log} from "@dedis/cothority";

import {HistoryObs} from "spec/support/historyObs";
import {BCTestEnv} from "spec/simul/itest";
import {KeyPair} from "src/keypair";

Log.lvl = 2;

describe("using real byzcoin, it should", () => {
    let bcTestEnv: BCTestEnv;

    beforeAll(async () => {
        Log.lvl1("Creating Byzcoin and first instance");
        try {
            bcTestEnv = await BCTestEnv.real();
            Log.lvl1("Correctly created real byzcoin");
        } catch (e) {
            Log.error(e);
            return Log.rcatch(e);
        }
        Log.lvl2("Done creating instance");
    });

    it("create a new user", async () => {
        // const history = new HistoryObs();
        // const user1 = await bcTestEnv.newCred("alias1");
        // const user2 = await bcTestEnv.newCred("alias2");

        // await user1.creds.addContact(bcTestEnv.bc, user1.keyPair.priv, user2.credID);
        // user1.creds.contactsObservable().subscribe((c) => {
        //     if (c.length > 0) {
        //         c[0].getValue().aliasObservable().subscribe((alias) =>
        //             history.push("newContact:" + alias));
        //     }
        // });
        //
        // await history.resolve(["newContact:alias2"]);
    });

    it("should listen for new blocks", async () => {
        const history = new HistoryObs();
        (await bcTestEnv.bc.getNewBlocks()).subscribe(
            {
                next: (b) => {
                    history.push("block");
                }
            }
        );
        await bcTestEnv.user.csbs.credPublic.email.setValue("as@as.as");
        await history.resolve(["block"]);
        await bcTestEnv.user.csbs.credPublic.email.setValue("as2@as.as");
        await history.resolve(["block"]);
    });

    it("should add and remove devices", async () => {
        const history = new HistoryObs();
        bcTestEnv.user.credSigner.getDevicesOHO().subscribe(
            devs => history.push("new:" +
                devs.map(dev => dev.getName()).join("--"))
        );
        await history.resolve(["new:device:initial"]);

        const kp = KeyPair.rand();
        await bcTestEnv.user.credSigner.addDevice("test", kp.signer());
        await history.resolve(["new:device:test"]);
    })
});
