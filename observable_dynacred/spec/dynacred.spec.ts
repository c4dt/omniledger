import {User} from "../src/user";
import {EAttributes} from "../src/credentials";
import {byzcoin, Log} from "@dedis/cothority";
import {Instances} from "../src/instances";
import {HistoryObs} from "spec/support/historyObs";
import {BCTestEnv} from "spec/simul/itest";
import {ByzCoinSimul} from "spec/simul/byzcoinSimul";

const {CredentialStruct, CredentialsInstance} = byzcoin.contracts;
const {ClientTransaction, Instruction, Argument} = byzcoin;

describe("pony-world example", () => {
    it("setting up of a new user in testing", async () => {
        const {db, inst, user} = await BCTestEnv.simul();
        await user.save();
        const user2 = await User.load(db, inst);
        expect(user2.kp).toEqual(user.kp);
        expect(user2.id).toEqual(user.id);
    });

    it("reading, writing, updating values of new user", async () => {
        const {bc, user} = await BCTestEnv.simul();
        const co = user.credential;
        const history = new HistoryObs();
        const obs1 = co.aliasObservable().subscribe((alias) => history.push("alias:" + alias));
        await history.resolve(["alias:alias"]);

        const obs2 = co.emailObservable().subscribe((email) => history.push("email:" + email));
        await history.resolve(["email:"]);

        await user.credential.updateCredentials(bc, user.kp.priv, {
            name: EAttributes.alias,
            value: "alias2"
        });
        await history.resolve(["alias:alias2"]);

        await user.credential.updateCredentials(bc, user.kp.priv, {
            name: EAttributes.alias,
            value: "alias3"
        }, {
            name: EAttributes.email,
            value: "test@test.com"
        });
        await history.resolve(["alias:alias3", "email:test@test.com"]);
        obs1.unsubscribe();
        obs2.unsubscribe();

        co.aliasObservable().subscribe((alias) => history.push("alias2:"+alias));
        await user.credential.updateCredentials(bc, user.kp.priv, {
            name: EAttributes.alias,
            value: "alias2"
        });
        await history.resolve(["alias2:alias3", "alias2:alias2"]);
    });

});
