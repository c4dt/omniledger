import {User} from "../src/user";
import {createUser} from "./helper.spec";
import {EAttributes} from "../src/credentials";
import {Log} from "@dedis/cothority";
import {Instances} from "../src/instances";

Log.lvl = 1;

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
        const history: string[] = [];
        co.aliasObservable().subscribe((alias) => history.push(alias));
        await expectAsync(newHistory(history, ["alias"])).toBeResolved();

        co.emailObservable().subscribe((email) => history.push(email));
        await expectAsync(newHistory(history, [""])).toBeResolved();

        await user.credential.updateCredentials(bc, user.kp.priv, {
            name: EAttributes.alias,
            value: "alias2"
        });
        await expectAsync(newHistory(history, ["alias2"])).toBeResolved();

        await user.credential.updateCredentials(bc, user.kp.priv, {
            name: EAttributes.alias,
            value: "alias3"
        }, {
            name: EAttributes.email,
            value: "test@test.com"
        });
        await expectAsync(newHistory(history, ["alias3", "test@test.com"])).toBeResolved();

        co.aliasObservable().subscribe((alias) => history.push(alias));
        await user.credential.updateCredentials(bc, user.kp.priv, {
            name: EAttributes.alias,
            value: "alias2"
        });
        await expectAsync(newHistory(history, ["alias3", "alias2", "alias2"])).toBeResolved();
    });

    it("should not ask new proofs when not necessary", async () => {
        const {bc, db, inst, user} = await createUser();
        const history: string[] = [];
        // Wait for all proofs to be made
        await new Promise(resolve => user.credential.aliasObservable()
            .subscribe(resolve));
        bc.getProofObserver.subscribe(() => history.push("P"));
        await expectAsync(newHistory(history, ["P"])).toBeResolved();

        Log.lvl2("Creating new instances object - there should be only one" +
            " getProof");
        const inst2 = await Instances.fromScratch(db, bc);
        await expectAsync(newHistory(history, ["P"])).toBeResolved();
        const io2 = (await inst2.instanceObservable(user.id)).subscribe(() => history.push("i2"));
        await expectAsync(newHistory(history, ["i2"])).toBeResolved();
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
        await expectAsync(newHistory(history, ["P"])).toBeResolved();
        const io3 = (await inst3.instanceObservable(user.id)).subscribe(
            (ii) => history.push("i3:" + ii.version.toNumber()));
        await expectAsync(newHistory(history, ["i3:0", "P", "i3:1"])).toBeResolved();
        io3.unsubscribe();
    });
});

async function newHistory(history: string[], newEntries: string[]): Promise<void> {
    for (let i = 0; i < 10; i++) {
        if (history.length < newEntries.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    Log.lvl3("History:", history, "wanted:", newEntries);
    if (history.length < newEntries.length) {
        throw new Error("not enough entries");
    }
    for (const e of newEntries) {
        const h = history.splice(0, 1)[0];
        if (e !== h) {
            throw new Error(`Got ${h} instead of ${e}`);
        }
    }
    if (history.length !== 0) {
        throw new Error(`didn't describe all history: ${history}`);
    }
    return;
}
