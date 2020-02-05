import {Log} from "@dedis/cothority";

import {CredentialFactory} from "src/credentialFactory";

import {createBCUser, IBCUser} from "spec/support/itest";
import {HistoryObs} from "spec/support/historyObs";

describe("using real byzcoin, it should", () => {
    let bcUser: IBCUser;

    beforeAll(async () => {
        Log.lvl1("Creating Byzcoin and first instance");
        try {
            bcUser = await createBCUser();
        } catch (e) {
            Log.error(e);
            return Log.rcatch(e);
        }
        Log.lvl2("Done creating instance");
    });

    it("set up an admin user", async () => {
        const history = new HistoryObs();
        bcUser.user.credential.contactsObservable().subscribe((c) => {
            Log.print("Got contact", c);
            if (c.length > 0) {
                c[0].getValue().aliasObservable().subscribe((alias) =>
                    history.push("newContact:" + alias));
            }
        });
        const u2 = CredentialFactory.newUser("alias2", bcUser.test.spawner.spawnerID);
        await bcUser.bc.storeUser(u2);
        await bcUser.user.addContact(bcUser.bc, u2.credID);
        await history.resolve(["newContact:alias2"]);
    });
});
