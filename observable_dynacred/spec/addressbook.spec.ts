import {Log} from "@c4dt/cothority/index";

import {UserSkeleton} from "observable_dynacred";

import {BCTestEnv} from "spec/simul/itest";
import {HistoryObs} from "spec/support/historyObs";

describe("Addressbook should", () => {
    it("handle contacts", async () => {
        const bct = await BCTestEnv.start();

        Log.lvl1("checking credentials adding and removing");
        const user = await bct.createUser("contacts");
        const history = new HistoryObs();
        const contacts = ["foo", "bar", "alice"].map((alias) =>
            new UserSkeleton(alias, user.spawnerInstanceBS.getValue().id)
        );

        await user.executeTransactions(tx => {
            contacts.forEach(c => tx.createUser(c));
        });

        Log.lvl2("subscribing to contactlist");
        user.addressBook.contacts.getOHO().subscribe((newContacts) => {
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
        await user.executeTransactions(tx => {
            user.addressBook.contacts.link(tx, contacts[0].credID);
        });
        await history.resolve(["add0"]);
        Log.lvl3("same add #2");
        await user.executeTransactions(tx => {
            user.addressBook.contacts.link(tx, contacts[0].credID);
        });
        await history.reject(["add0"]);
        Log.lvl3("same add #3 (new buffer with same id)");
        await user.executeTransactions(tx => {
            user.addressBook.contacts.link(tx, Buffer.from(contacts[0].credID));
        });
        await history.reject(["add0"]);
        Log.lvl3("rm #4");
        await user.executeTransactions(tx => {
            user.addressBook.contacts.unlink(tx, contacts[0].credID);
        });
        await history.resolve(["del0"]);

        // Add multiple
        await user.executeTransactions(tx => {
            user.addressBook.contacts.link(tx, contacts[0].credID);
        });
        await history.resolve(["add0"]);
        await user.executeTransactions(tx => {
            user.addressBook.contacts.link(tx, contacts[1].credID);
        });
        await history.resolve(["add1"]);
    });
});
