import {Observable} from "tns-core-modules/data/observable";
import { ServerIdentity, Roster } from "~/lib/cothority/network";
import { Data } from "~/lib/dynacred";
import {ObservableArray} from "tns-core-modules/data/observable-array";
import {Defaults} from "~/lib/dynacred/Defaults";
import { uData } from "~/user-data";
import { StatusRPC } from "~/lib/cothority/status";
import Log from "~/lib/cothority/log";

export class AdminViewModel extends Observable {
    nodes:ObservableArray<Node> = new ObservableArray();
    testing:boolean = Defaults.Testing;

    constructor(d: Data) {
        super();
        this.admin = new Admin(d.continuousScan);
        this.updateNodes();
    }

    updateNodes(){
        this.nodes.splice(0);
        if (uData.bc) {
            uData.bc.getConfig().roster.list.forEach((si, i) => this.nodes.push(new Node(si, this)));
        }
    }

    set admin(value: Admin) {
        this.set("_admin", value);
    }

    get admin(): Admin {
        return this.get("_admin");
    }
}

export class Admin {
    constructor(public continuousScan: boolean) {
    }
}

export class Node {
    address: string;
    status: string;

    constructor(si: ServerIdentity, am: AdminViewModel) {
        this.address = si.address;
        this.status = "unknown";

        const s = new StatusRPC(new Roster({ list: [ si ]}));
        const st = s.getStatus().then((s)=> {
            // got status, put it into the right spot
            this.status = "ok, up " + s.getStatus("Generic")["field"]["Uptime"];
            // trigger an update.
            am.nodes.splice(0, 0)
        }).catch((e) => {
            this.status = "error";
            Log.catch(e);
        })
    }
}
