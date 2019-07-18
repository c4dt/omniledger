import {Observable} from "tns-core-modules/data/observable";
import {Contact} from "~/lib/Contact";
import {Log} from "~/lib/Log";
import {gData} from "~/lib/Data";
import {friendsUpdateList, setProgress} from "~/pages/identity/contacts/contacts-page";
import {topmost} from "tns-core-modules/ui/frame";
import {ItemEventData} from "tns-core-modules/ui/list-view";
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as Long from "long";
import {assertRegistered, sendCoins} from "~/lib/ui/users";
import {msgFailed, msgOK} from "~/lib/ui/messages";
import {CredentialStruct} from "~/lib/cothority/byzcoin/contracts/CredentialInstance";
import {Meetup, UserLocation} from "~/lib/PersonhoodRPC";

export class MeetupView extends Observable {
    _userViews: UserView[];
    users: UserLocation[];
    private _networkStatus: string;

    constructor() {
        super();
    }

    updateUsers(users: UserLocation[]) {
        this.users = users.filter((user, i) =>
            users.findIndex(u => u.equals(user)) == i)
            .filter(u => u.alias != gData.alias);
        Contact.sortAlias(this.users).map(u => u.alias);
        this._userViews = this.users.map(u => new UserView(u));
        this.notifyPropertyChange("userViews", this._userViews);
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
    private _user: UserLocation;

    constructor(user: UserLocation) {
        super();

        this._user = user;
    }

    set user(user: UserLocation) {
        this._user = user;
    }

    get alias(): string {
        return this._user.credential.getAttribute("personal", "alias").toString();
    }

    public async showUser(arg: ItemEventData) {
        topmost().showModal("pages/modal/modal-user", this._user,
            () => {
            }, false, false, false);
    }
}
