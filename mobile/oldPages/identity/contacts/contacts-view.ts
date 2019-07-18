import {Observable} from "tns-core-modules/data/observable";
import {Contact} from "~/lib/Contact";
import {Log} from "~/lib/Log";
import {gData} from "~/lib/Data";
import {contacts, friendsUpdateList, setProgress} from "~/pages/identity/contacts/contacts-page";
import {topmost} from "tns-core-modules/ui/frame";
import {ItemEventData} from "tns-core-modules/ui/list-view";
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as Long from "long";
import {assertRegistered, sendCoins} from "~/lib/ui/users";
import {msgFailed, msgOK} from "~/lib/ui/messages";

export class ContactsView extends Observable {
    private _users: UserView[];
    private _networkStatus: string;

    constructor(users: Contact[]) {
        super();

        // Initialize default values.
        this.updateUsers(users);
    }

    updateUsers(users: Contact[]) {
        Contact.sortAlias(users);
        this._users = users.map(u => new UserView(u));
        this.notifyUpdate();
    }

    notifyUpdate() {
        this.notifyPropertyChange("users", this._users);
    }

    public set networkStatus(str: string) {
        this._networkStatus = str;
        this.notifyPropertyChange("networkStatus", this._networkStatus);
    }

    public get networkStatus(): string {
        return this._networkStatus;
    }
}

export class UserView extends Observable {
    private _user: Contact;

    constructor(user: Contact) {
        super();

        this._user = user;
    }

    set user(user: Contact) {
        this._user = user;
    }

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

    public async deleteUser(arg: ItemEventData) {
        if (await dialogs.confirm({
            title: "Remove user",
            message: "Are you sure to remove user " + this._user.alias + " from your list?",
            okButtonText: "Remove",
            cancelButtonText: "Keep",
        })) {
            gData.rmContact(this._user);
            await gData.save();
            friendsUpdateList();
        }
    }

    public async showUser(arg: ItemEventData) {
        topmost().showModal("pages/modal/modal-user", this._user,
            () => {
            }, false, false, false);
    }

    public async payUser(args: ItemEventData) {
        try {
            await sendCoins(this._user, setProgress);
            contacts.notifyUpdate();
            this.notifyPropertyChange("isRegistered", this.isRegistered);
        } catch (e) {
            Log.catch(e);
            await msgFailed(e, "Error");
        }
        setProgress();
    }

    public async credUser(arg: ItemEventData) {
        try {
            if (!this._user.isRegistered()) {
                await this._user.verifyRegistration(gData.bc);
            }
            await this._user.update(gData.bc);
            await gData.save();
            this.notifyPropertyChange("isRegistered", this.isRegistered);
        } catch (e) {
            Log.catch("Couldn't update", this.alias, e)
        }
        topmost().navigate({
            moduleName: "pages/identity/contacts/actions/actions-page",
            context: this._user
        });
    }
}
