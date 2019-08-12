import { Observable } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import Log from "~/lib/cothority/log";
import { Roster, ServerIdentity } from "~/lib/cothority/network";
import { StatusRPC } from "~/lib/cothority/status";
import { Data } from "~/lib/dynacred";
import { testingMode, uData } from "~/lib/user-data";

export class AdminViewModel extends Observable {
    nodes: ObservableArray<Node> = new ObservableArray();
    testing: boolean = testingMode;

    constructor(d: Data) {
        super();
        this.admin = new Admin(d.continuousScan);
        this.updateNodes();
    }

    updateNodes() {
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

        const status = new StatusRPC(new Roster({ list: [ si ]}));
        status.getStatus().then((s) => {
            // got status, put it into the right spot
            this.status = "ok, up " + s.getStatus("Generic").field.Uptime;
            // trigger an update.
            am.nodes.splice(0, 0);
        }).catch((e) => {
            this.status = "error";
            Log.catch(e);
        });
    }
}
