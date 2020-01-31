import {User} from "../src/user";
import {createUser, History} from "./helper.spec";
import {EAttributes} from "../src/credentials";
import {Log} from "@dedis/cothority";
import {Instances} from "../src/instances";

describe("pony-world example", () => {
    it("setting up of a new user in testing", async () => {
        const {db, inst, user} = await createUser();
        await user.save();
        const user2 = await User.load(db, inst);
        expect(user2.kp).toEqual(user.kp);
        expect(user2.id).toEqual(user.id);
    });

    it("reading, writing, updating values of new user", async () => {
        const {bc, user} = await createUser();
        const co = user.credential;
        const history = new History();
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

    it("should not ask new proofs when not necessary", async () => {
        const {bc, db, inst, user} = await createUser();
        const history = new History();
        // Wait for all proofs to be made
        await new Promise(resolve => user.credential.aliasObservable()
            .subscribe(resolve));
        bc.getProofObserver.subscribe(() => history.push("P"));
        await history.resolve(["P"]);

        Log.lvl2("Creating new instances object - there should be only one" +
            " getProof");
        const inst2 = await Instances.fromScratch(db, bc);
        await inst2.reload();
        await history.resolve(["P"]);
        const io2 = (await inst2.instanceObservable(user.id)).subscribe(() => history.push("i2"));
        await history.resolve(["i2"]);
        io2.unsubscribe();

        Log.lvl2("Changing the config-instance, new instances object should" +
            " request proof for new instance");
        await bc.addTransaction({
            update: {
                instID: user.id,
                value: Buffer.from("123")
            }
        });
        const inst3 = await Instances.fromScratch(db, bc);
        await inst3.reload();
        await history.resolve(["P"]);
        const io3 = (await inst3.instanceObservable(user.id)).subscribe(
            (ii) => history.push("i3:" + ii.version.toNumber()));
        await history.resolve(["i3:0", "P", "i3:1"]);
        io3.unsubscribe();
    });
});
