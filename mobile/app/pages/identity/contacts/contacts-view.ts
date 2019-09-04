import Long from "long";
import { Observable } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view";
import Log from "~/lib/cothority/log";
import { Contact } from "~/lib/dynacred/Contact";
import { msgFailed, msgOK } from "~/lib/messages";
import { uData } from "~/lib/user-data";
import { friendsUpdateList, setProgress } from "~/pages/identity/contacts/contacts-page";

export class ContactsView extends Observable {

    get networkStatus(): string {
        return this._networkStatus;
    }

    set networkStatus(str: string) {
        this._networkStatus = str;
        this.notifyPropertyChange("networkStatus", this._networkStatus);
    }
    private _users: UserView[];

    private _networkStatus: string;

    constructor(users: Contact[]) {
        super();

        // Initialize default values.
        this.updateUsers(users);
    }

    updateUsers(users: Contact[]) {
        Contact.sortAlias(users);
        this._users = users.map((u) => new UserView(u));
        this.notifyUpdate();
    }

    notifyUpdate() {
        this.notifyPropertyChange("users", this._users);
    }
}

export class UserView extends Observable {

    get alias(): string {
        return this._user.alias;
    }

    get isRegistered(): boolean {
        try {
            return this._user.isRegistered();
        } catch (e) {
            Log.error(e);
            return false;
        }
    }

    set user(user: Contact) {
        this._user = user;
    }

    static async payUser(u: Contact, progress: any) {
        try {
            if (!u.isRegistered()) {
                if (await uData.canPay(uData.signupCost())) {
                    // tslint:disable:object-literal-sort-keys
                    const pay = await dialogs.confirm({
                        title: "Register user",
                        message: "This user is not registered yet - do you want to pay " +
                            uData.signupCost().toString() + " for the registration of user " +
                            u.alias + "?",
                        okButtonText: "Yes, pay",
                        cancelButtonText: "No, don't pay",
                    });
                    if (pay) {
                        await uData.registerContact(u, Long.fromNumber(0), progress);
                    }
                    await u.isRegistered();
                    await msgOK(u.alias + " is now registered and can be paid.");
                    uData.references.push(u.alias);
                    await uData.save();
                } else {
                    await msgFailed("The use you want to pay is unregistered. " +
                        "You do not have enough coins to invite an unregistered user.");
                    return;
                }
            }
            const reply = await dialogs.prompt({
                title: "Send coins",
                message: "How many coins do you want to send to " + u.alias,
                okButtonText: "Send",
                cancelButtonText: "Cancel",
                defaultText: "10000",
            });
            if (reply.result) {
                const coins = Long.fromString(reply.text);
                if (await uData.canPay(coins)) {
                    const target = u.getCoinAddress();
                    if (target) {
                        progress("Transferring coin", 50);
                        await uData.coinInstance.transfer(coins, target, [uData.keyIdentitySigner]);
                        progress("Success", 100);
                        await msgOK("Transferred " + coins.toString() + " to " + u.alias);
                        progress();
                    } else {
                        await msgFailed("couldn't get targetAddress");
                    }
                } else {
                    await msgFailed("Cannot pay " + coins.toString() + " coins.");
                }
            }

            // contacts.notifyUpdate();
        } catch (e) {
            Log.catch(e);
            await msgFailed(e.toString(), "Error");
        }
        progress();
    }

    private _user: Contact;

    constructor(user: Contact) {
        super();

        this._user = user;
    }

    async deleteUser(arg: ItemEventData) {
        // tslint:disable:object-literal-sort-keys
        if (await dialogs.confirm({
            title: "Remove user",
            message: "Are you sure to remove user " + this._user.alias + " from your list?",
            okButtonText: "Remove",
            cancelButtonText: "Keep",
        })) {
            uData.rmContact(this._user);
            friendsUpdateList();
            await uData.save();
        }
    }

    async showUser(arg: ItemEventData) {
        topmost().showModal("pages/modal/modal-user", this._user,
            () => {
                Log.lvl3("closed");
            }, false, false, false);
    }

    async payThisUser(arg: ItemEventData) {
        UserView.payUser(this._user, setProgress);
    }

    async credUser(arg: ItemEventData) {
        try {
            if (!this._user.isRegistered()) {
                await this._user.isRegistered();
            }
            setProgress("Fetching latest " + this._user.alias, 33);
            await this._user.updateOrConnect(uData.bc);
            setProgress("Saving data", 66);
            await uData.save();
            this.notifyPropertyChange("isRegistered", this.isRegistered);
            setProgress("Done", 100);
        } catch (e) {
            Log.catch("Couldn't update", this.alias, e);
        }
        setProgress();
        topmost().navigate({
            moduleName: "pages/identity/contacts/actions/actions-page",
            context: this._user,
        });
    }
}
