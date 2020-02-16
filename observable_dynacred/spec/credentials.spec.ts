import {UserFactory} from "src/userFactory";
import {Log} from "@dedis/cothority";
import {HistoryObs} from "spec/support/historyObs";
import {BCTestEnv} from "spec/simul/itest";

Log.lvl = 2;

describe("Credentials should", () => {

    it("do with contacts:", async () => {
        Log.lvl1("checking credentials adding and removing");
        const bct = await BCTestEnv.simul();
        const {user, spawnerInstance} = bct;
        const history = new HistoryObs();
        const contacts = ["foo", "bar", "alice"].map((alias) =>
            new UserFactory(alias, spawnerInstance.id)
        );
        for (const u of contacts){
            await bct.storeUser(u, user.coin.coinInstance(), user.dt.kp.signer());
        }

        Log.lvl2("subscribing to contactlist");
        user.contactList.subscribe((newContacts) => {
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
        await user.contactList.addContact(contacts[0].credID);
        await history.resolve(["add0"]);
        Log.lvl3("same add #2");
        await user.contactList.addContact(contacts[0].credID);
        await history.reject(["add0"]);
        Log.lvl3("same add #3 (new buffer with same id)");
        await user.contactList.addContact(Buffer.from(contacts[0].credID));
        await history.reject(["add0"]);
        Log.lvl3("rm #4");
        await user.contactList.rmContact(Buffer.from(contacts[0].credID));
        await history.resolve(["del0"]);

        // Add multiple
        await user.contactList.addContact(contacts[0].credID);
        await history.resolve(["add0"]);
        await user.contactList.addContact(contacts[1].credID);
        await history.resolve(["add1"]);
    });
});
