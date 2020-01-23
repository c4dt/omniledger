import {User} from "../src/user";
import {createUser} from "./helper.spec";
import {EAttributes} from "../src/credentials";
import {Log} from "@dedis/cothority";
import {Observable, Subject} from "rxjs";
import {timeout} from "rxjs/operators";

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
        co.aliasObservable().subscribe(
            {next: (alias) => history.push(alias)}
        );
        await expectAsync(newHistory(history, ["alias"])).toBeResolved();

        co.emailObservable().subscribe(
            {next: (email) => history.push(email)}
        );
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

        co.aliasObservable().subscribe(
            {next: (alias) => history.push(alias)}
        );
        await user.credential.updateCredentials(bc, user.kp.priv, {
            name: EAttributes.alias,
            value: "alias2"
        });
        await expectAsync(newHistory(history, ["alias3", "alias2", "alias2"])).toBeResolved();
    });

    it ("understanding Observables and BehaviorSubject", () => {
        const history: string[] = [];
        const obs = new Observable<string>((sub) => {
            history.push("sub");
            sub.next("1");
            sub.next("2");
        });
        obs.subscribe({next: (v) => {history.push("A" + v)}});
        obs.subscribe({next: (v) => {history.push("B" + v)}});
        newHistory(history, ["sub", "A1", "A2", "sub", "B1", "B2"]);

        const subj = new Subject<string>();
        subj.subscribe({next: (v) => {history.push("C"+v)}});
        subj.subscribe({next: (v) => {history.push("D"+v)}});
        subj.next("3");
        newHistory(history, ["C3", "D3"]);
    })
});

async function newHistory(history: string[], newEntries: string[]): Promise<void>{
    for (let i = 0; i < 10; i++){
        if (history.length !== newEntries.length){
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    for (const e of newEntries){
        const h = history.splice(0, 1)[0];
        if (e !== h){
            Log.error(e, "is not", h);
            return Promise.reject(`"${e}" is not "${h}"`);
        }
    }
    if (history.length !== 0){
        return Promise.reject(`didn't describe all history: ${history}`)
    }
    return;
}
