import {Log} from "@dedis/cothority";

import {CredentialFactory} from "src/credentialFactory";

import {createBCUser, IBCUser} from "spec/support/itest";

describe("using real byzcoin, it should", () => {
    let user: IBCUser;

    beforeAll(async () => {
        Log.lvl1("Creating Byzcoin and first instance");
        try {
            user = await createBCUser();
        } catch (e) {
            return Log.rcatch(e);
        }
        Log.lvl2("Done creating instance");
    });

    it("set up an admin user", async () => {
        Log.print(user, user.test.genesisUser.darc);
        const u2 = CredentialFactory.newUser("alias2", user.test.spawner.spawnerID);
    });
});
