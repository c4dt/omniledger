import {Log} from "@dedis/cothority";

import {HistoryObs} from "spec/support/historyObs";
import {BCTestEnv} from "spec/simul/itest";

xdescribe("using real byzcoin, it should", () => {
    let bcTestEnv: BCTestEnv;

    beforeAll(async () => {
        Log.lvl1("Creating Byzcoin and first instance");
        try {
            bcTestEnv = await BCTestEnv.real();
        } catch (e) {
            Log.error(e);
            return Log.rcatch(e);
        }
        Log.lvl2("Done creating instance");
    });

    it("set up an admin user", async () => {
        const history = new HistoryObs();
        const user1 = await bcTestEnv.newCred("alias1");
        const user2 = await bcTestEnv.newCred("alias2");

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
        bcTestEnv.bc.getNewBlocks().subscribe(
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
    })
});
