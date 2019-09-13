import Long from "long";
import { localize } from "nativescript-localize";
import { Observable } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view";
import DarcInstance from "~/lib/cothority/byzcoin/contracts/darc-instance";
import { Darc, Rule } from "~/lib/cothority/darc";
import Log from "~/lib/cothority/log";
import { Contact } from "~/lib/dynacred/Contact";
import { msgFailed, msgOK } from "~/lib/messages";
import { adminDarc, isAdmin, uData } from "~/lib/user-data";
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
            progress("Check if user is registered", 15);
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
                        progress("Register user", 20);
                        await uData.registerContact(u, Long.fromNumber(0), progress);
                    }
                    if (!(await u.isRegistered())) {
                        throw new Error("registration failed");
                    }
                    progress("User registered", 30);
                    await msgOK(u.alias + " is now registered and can be paid.");
                    uData.references.push(u.alias);
                    progress("Saving data", 40);
                    await uData.save();
                } else {
                    progress("Refused to pay", -100);
                    await msgFailed("The use you want to pay is unregistered. " +
                        "You do not have enough coins to invite an unregistered user.");
                    progress();
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
                        progress(localize("contacts.transfer"), 50);
                        await uData.coinInstance.transfer(coins, target, [uData.keyIdentitySigner]);
                        progress(localize("progress.success"), 100);
                        await msgOK(localize("contacts.transferred", coins.toString(), u.alias));
                        progress();
                    } else {
                        await msgFailed(localize("contacts.transfer_fail1"));
                    }
                } else {
                    await msgFailed(localize("contacts.transfer_fail2", coins.toString()));
                }
            }

            // contacts.notifyUpdate();
        } catch (e) {
            Log.catch(e);
            await msgFailed(e.toString(), "Error");
        }
        progress();
    }

    static async inviteUser(u: Contact, progress: any) {
        try {
            progress("Check if user is registered", 15);
            if (!u.isRegistered()) {
                if (await uData.canPay(uData.signupCost())) {
                    // tslint:disable:object-literal-sort-keys
                    const pay = await dialogs.confirm({
                        title: "Invite user",
                        message: "This user is not invited yet - do you want to pay " +
                            (10000 + uData.signupCost().toNumber()) + " to invite the user " +
                            u.alias + "?",
                        okButtonText: "Yes, pay",
                        cancelButtonText: "No, don't pay",
                    });
                    if (pay) {
                        progress("Register user", 20);
                        await uData.registerContact(u, Long.fromNumber(0), progress);
                    }
                    if (!(await u.isRegistered())) {
                        throw new Error("registration failed");
                    }
                    progress("User registered", 30);
                    uData.references.push(u.alias);
                    progress("Saving data", 40);
                    await uData.save();
                } else {
                    progress("Refused to pay", -100);
                    await msgFailed("The use you want to pay is unregistered. " +
                        "You do not have enough coins to invite an unregistered user.");
                    progress();
                    return;
                }
            } else {
                await msgOK("This user is already on the blockchain - invite another one!");
                return;
            }
            const coins = Long.fromNumber(10000);
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
        } catch (e) {
            Log.catch(e);
            await msgFailed(e.toString(), "Error");
        }
        progress();
    }
    isAdmin = isAdmin;

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
            try {
                setProgress(localize("contacts.deleting"), 20);
                uData.rmContact(this._user);
                setProgress(localize("contacts.updating_others"), 40);
                friendsUpdateList();
                setProgress(localize("contacts.saving_byzcoin"), 60);
                await uData.save();
                setProgress(localize("progress.done"), 100);
            } catch (e) {
                Log.catch(e);
                setProgress(localize("progress.error", e.toString()), -100);
            }
            setProgress();
        }
    }

    async showUser(arg: ItemEventData) {
        topmost().showModal("pages/modal/modal-user", this._user,
            () => {
                Log.lvl3("closed");
            }, false, false, false);
    }

    async payThisUser(arg: ItemEventData) {
        await UserView.payUser(this._user, setProgress);
    }

    async credUser(arg: ItemEventData) {
        try {
            setProgress(localize("contacts.fetching", this._user.alias), 33);
            await this._user.updateOrConnect(uData.bc);
            setProgress(localize("progress.saving"), 66);
            await uData.save();
            this.notifyPropertyChange("isRegistered", this.isRegistered);
            setProgress(localize("progress.done"), 100);
        } catch (e) {
            Log.catch("Couldn't update", this.alias, e);
        }
        setProgress();
        topmost().navigate({
            moduleName: "pages/identity/contacts/actions/actions-page",
            context: this._user,
        });
    }

    async makeAdmin() {
        try {
            if (!this.isRegistered) {
                await msgFailed("Cannot make an unregistered user admin");
                return;
            }
            setProgress("making admin", 33);
            const admin = await DarcInstance.fromByzcoin(uData.bc, adminDarc);
            const newAdmin = admin.darc.evolve();
            newAdmin.addIdentity(Darc.ruleSign, await this._user.getDarcSignIdentity(), Rule.OR);
            newAdmin.addIdentity(DarcInstance.ruleEvolve, await this._user.getDarcSignIdentity(), Rule.OR);
            await admin.evolveDarcAndWait(newAdmin, [uData.keyIdentitySigner], 10);
            setProgress("Done", 100);
        } catch (e) {
            Log.catch(e);
            setProgress("Error", -100);
            await msgFailed("Couldn't update darc:", e.toString());
        }
        setProgress();
    }
}
