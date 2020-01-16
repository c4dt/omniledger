import {User} from "../src/user";
import {createUser} from "./helper.spec";

describe("pony-world example", () => {
    it("setting up of a new user in testing", async () => {
        const {db, inst, user} = await createUser();
        await user.save();
        const user2 = await User.load(db, inst);
        expect(user2).toEqual(user);
    });

    it("reading of values of new user", async () => {
        const {user} = await createUser();
        const co = await user.getCredential();
        const history: string[] = [];
        co.alias.subscribe({next: (alias) => history.push(alias)});
        expect(history).toEqual(["alias"]);
    });
});
