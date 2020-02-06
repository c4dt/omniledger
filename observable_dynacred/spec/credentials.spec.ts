import {CredentialFactory} from "../src/credentialFactory";
import {Log} from "@dedis/cothority";
import {HistoryObs} from "spec/support/historyObs";
import {BCTestEnv} from "spec/support/itest";

describe("Credentials should", () => {

    it("do with contacts:", async () => {
        Log.lvl1("checking credentials adding and removing");
        const {bc, db, inst, user, test} = await BCTestEnv.simul();
        const history = new HistoryObs();
        const contacts = ["foo", "bar", "alice"].map((alias) => {
            return CredentialFactory.newUser(alias, test.spawner.spawnerID);
        });
        contacts.forEach((u) => bc.storeUser(u));

        user.credential.contactsObservable().subscribe((newContacts) => {
            newContacts.forEach((c) => {
                c.subscribe({
                    next: (nc) => {
                        history.push("add" +
                            contacts.findIndex((co) =>
                                co.credID.equals(nc.id)));
                    },
                    complete: () => {
                        history.push("del" + contacts.findIndex((co) => co.credID.equals(c.getValue().id)));
                    }
                })
            })
        });

        Log.lvl2("block of adds and deletions");
        Log.lvl3("add #1");
        await user.addContact(bc, contacts[0].credID);
        await history.resolve(["add0"]);
        Log.lvl3("same add #2");
        await user.addContact(bc, contacts[0].credID);
        await history.reject(["add0"]);
        Log.lvl3("same add #3 (new buffer with same id)");
        await user.addContact(bc, Buffer.from(contacts[0].credID));
        await history.reject(["add0"]);
        Log.lvl3("rm #4");
        await user.rmContact(bc, Buffer.from(contacts[0].credID));
        await history.resolve(["del0"]);
        return;

        // Add multiple
        await user.addContact(bc, contacts[0].credID);
        await history.resolve(["add0"]);
        await user.addContact(bc, contacts[1].credID);
        await history.resolve(["add1"]);
    });
});
