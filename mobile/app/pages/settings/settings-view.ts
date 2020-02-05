// tslint:disable-next-line
require("nativescript-nodeify");

import { Data } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { Roster, ServerIdentity } from "@dedis/cothority/network";
import { WebSocketConnection } from "@dedis/cothority/network/connection";
import { StatusRPC } from "@dedis/cothority/status";
import { StatusRequest, StatusResponse } from "@dedis/cothority/status/proto";
import { Observable } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { appVersion, bcDef, isAdmin } from "~/lib/byzcoin-def";
import { nodeList } from "~/pages/settings/settings-page";

export class AdminViewModel extends Observable {
    nodes: ObservableArray<Node> = new ObservableArray();
    testing: boolean = bcDef.testingMode;
    version = appVersion;
    isAdmin = isAdmin;

    constructor(d: Data) {
        super();
        this.admin = new Admin(d.continuousScan);
        this.updateNodes();
    }

    async updateNodes() {
        this.nodes.splice(0);
        if (nodeList) {
            this.nodes.push(...nodeList.map((ws) => new Node(ws, this)));
            await Promise.all(this.nodes.map((n) => n.getStatus()));
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

    constructor(private ws: WebSocketConnection, private am: AdminViewModel) {
        this.address = ws.getURL();
        this.status = "unknown";
    }

    async getStatus() {
        try {
            const stat: StatusResponse = await this.ws.send(new StatusRequest(), StatusResponse);
            Log.lvl2("Got status from", this.address);
            this.status = "up " + stat.getStatus("Generic").field.Uptime;
        } catch (e) {
            this.status = "error";
        }
        this.am.nodes.splice(0, 0);
    }
}
