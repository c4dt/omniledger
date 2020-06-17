import { Log } from "@dedis/cothority/index";

import { User } from "dynacred";
import { BCTestEnv } from "spec/simul/itest";
import { HistoryObs } from "spec/support/historyObs";

describe("Addressbook should", () => {
    it("handle contacts", async () => {
        const bct = await BCTestEnv.start();

        Log.lvl1("checking credentials adding and removing");
        const user = await bct.createUser("contacts");
        const contacts: User[] = [];
        for (const name of ["foo", "bar", "alice"]) {
            contacts.push(await bct.createUser(name));
        }

        Log.lvl2("subscribing to contactlist");
        const history = new HistoryObs();
        user.addressBook.contacts.subscribe((ids) => {
            history.push("update:" + ids.map((id) => id.credPublic.alias.getValue()).join("::"));
        });
        await history.resolve(["update:"]);

        Log.lvl2("block of adds and deletions");
        Log.lvl3("add #1");
        await user.executeTransactions((tx) => {
            user.addressBook.contacts.link(tx, contacts[0].credStructBS.id);
        });
        await history.resolve(["update:foo"]);
        Log.lvl3("same add #2");
        await user.executeTransactions((tx) => {
            user.addressBook.contacts.link(tx, contacts[0].credStructBS.id);
        });
        await history.reject(["update:"]);
        Log.lvl3("same add #3 (new buffer with same id)");
        await user.executeTransactions((tx) => {
            user.addressBook.contacts.link(tx, Buffer.from(contacts[0].credStructBS.id));
        });
        await history.reject(["update:"]);
        Log.lvl3("rm #4");
        await user.executeTransactions((tx) => {
            user.addressBook.contacts.unlink(tx, contacts[0].credStructBS.id);
        });

        await history.resolve(["update:"]);

        // Add multiple
        await user.executeTransactions((tx) => {
            user.addressBook.contacts.link(tx, contacts[0].credStructBS.id);
        });
        await history.resolve(["update:foo"]);
        await user.executeTransactions((tx) => {
            user.addressBook.contacts.link(tx, contacts[1].credStructBS.id);
        });
        await history.resolve(["update:foo::bar"]);
    });
});
