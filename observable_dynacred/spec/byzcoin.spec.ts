import {Log} from "@dedis/cothority";

import {CredentialFactory} from "src/credentialFactory";

import {createBCUser, IBCUser} from "spec/support/itest";

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
        const u2 = CredentialFactory.newUser("alias2", bcUser.test.spawner.spawnerID);
        await bcUser.bc.storeUser(u2);
        // bcUser.user.addContact()
    });
});
