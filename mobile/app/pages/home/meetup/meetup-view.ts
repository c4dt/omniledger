import { Observable } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view";
import Log from "~/lib/cothority/log";
import { Contact } from "~/lib/dynacred/Contact";
import { UserLocation } from "~/lib/dynacred/personhood-rpc";
import { uData } from "~/lib/user-data";

export class MeetupView extends Observable {
    _userViews: UserView[];
    users: UserLocation[];
    private _networkStatus: string;

    constructor() {
        super();
    }

    updateUsers(users: UserLocation[]) {
        this.users = users.filter((user, i) =>
            users.findIndex((u) => u.equals(user)) === i)
            .filter((u) => u.alias !== uData.alias);
        Contact.sortAlias(this.users).map((u) => u.alias);
        this._userViews = this.users.map((u) => new UserView(u));
        this.notifyPropertyChange("userViews", this._userViews);
    }

    set networkStatus(str: string) {
        this._networkStatus = str;
        this.notifyPropertyChange("networkStatus", this._networkStatus);
    }

    get networkStatus(): string {
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
        const aliasbuf = this._user.credential.getAttribute("1-public", "alias");
        return aliasbuf ? aliasbuf.toString() : "unknown";
    }

    async showUser(arg: ItemEventData) {
        topmost().showModal("pages/modal/modal-user", this._user,
            () => { Log.lvl3("done"); }, false, false, false);
    }
}
