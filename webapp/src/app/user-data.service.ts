import "cross-fetch/polyfill";

import { Injectable } from "@angular/core";

import { ByzCoinRPC } from "@c4dt/cothority/byzcoin";
import Log from "@c4dt/cothority/log";

import { IConnection, RosterWSConnection } from "@c4dt/cothority/network/connection";
import { StatusRequest, StatusResponse } from "@c4dt/cothority/status/proto";
import StatusRPC from "@c4dt/cothority/status/status-rpc";
import { Config, Data, StorageDB } from "@c4dt/dynacred";

@Injectable({
    providedIn: "root",
})
/**
 * UserData can be used as a global data in the app. However, when using it outside
 * of the UI, it is important to always pass the data, so that it is simpler to
 * test the libraries.
 */
export class UserData extends Data {
    bc: ByzCoinRPC;
    config: Config;
    conn: IConnection;

    constructor() {
        super(undefined); // poison
        this.storage = StorageDB;
    }

    async loadConfig(logger: (msg: string, percentage: number) => void): Promise<void> {
        Log.print("loading config");
        logger("Loading config", 0);
        const res = await fetch("assets/config.toml");
        if (!res.ok) {
            return Promise.reject(`fetching config gave: ${res.status}: ${res.body}`);
        }
        this.config = Config.fromTOML(await res.text());
        logger("Pinging nodes", 10);
        this.conn = new RosterWSConnection(this.config.roster, StatusRPC.serviceName);
        this.conn.setParallel(this.config.roster.length);
        for (let i = 0; i < 5; i++) {
            await this.conn.send(new StatusRequest(), StatusResponse);
            const url = this.conn.getURL();
            logger(`Fastest node at ${i}/5: ${url}`, 20 + i * 15);
        }
        this.conn.setParallel(1);
        logger("Fetching latest block", 70);
        this.bc = await ByzCoinRPC.fromByzcoin(this.conn, this.config.byzCoinID);
        logger("Done connecting", 100);
    }

    async load() {
        Log.lvl1("Loading data from", this.dataFileName);
        const values = await this.storage.getObject(this.dataFileName);
        if (values === undefined) {
            throw new Error("No data available");
        }
        this.setValues(values);
        await this.connectByzcoin();
    }
}

// @ts-ignore
global.UserData = UserData;
