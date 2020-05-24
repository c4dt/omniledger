import { BCTestEnv } from "spec/simul/itest";
import { HistoryObs } from "spec/support/historyObs";

describe("CredentialStructBS should", () => {
    it("reading, writing, updating values of new user", async () => {
        const bct = await BCTestEnv.start();
        const user = await bct.createUser("update values");

        const alias = user.credStructBS.credPublic.alias;
        const email = user.credStructBS.credPublic.email;
        const history = new HistoryObs();
        const obs1 = alias.subscribe((a) => history.push("alias:" + a));
        await history.resolve(["alias:" + user.credStructBS.credPublic.alias.getValue()]);

        const obs2 = email.subscribe((e) => history.push("email:" + e));
        await history.resolve(["email:"]);

        await user.executeTransactions((tx) => {
            alias.setValue(tx, "alias2");
        });
        await history.resolve(["alias:alias2"]);

        await user.executeTransactions((tx) => {
            alias.setValue(tx, "alias3");
        });
        await user.executeTransactions((tx) => {
            email.setValue(tx, "test@test.com");
        });
        await history.resolve(["alias:alias3", "email:test@test.com"]);
        obs1.unsubscribe();
        obs2.unsubscribe();

        alias.subscribe((a) => history.push("alias2:" + a));
        await user.executeTransactions((tx) => {
            alias.setValue(tx, "alias2");
        });
        await history.resolve(["alias2:alias3", "alias2:alias2"]);
    });
});
