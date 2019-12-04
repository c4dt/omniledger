import "cross-fetch/polyfill";

import { Injectable } from "@angular/core";

import { ByzCoinRPC } from "@dedis/cothority/byzcoin";

import { Config, Data, StorageDB } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";

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
    public config: Config;

    constructor() {
        super(undefined); // poison
        this.storage = StorageDB;
    }

    async loadConfig(logger: (msg: string) => void): Promise<void> {
        Log.print("loading config");
        logger("Loading config");
        const res = await fetch("assets/config.toml");
        if (!res.ok) {
            return Promise.reject(`fetching config gave: ${res.status}: ${res.body}`);
        }
        this.config = Config.fromTOML(await res.text());
        logger("Fetching latest block");
        this.bc = await ByzCoinRPC.fromByzcoin(this.config.roster, this.config.byzCoinID);
        logger("Pinging nodes");
        const wsc = (<any>this.bc).conn;
        wsc.setParallel(5);
        for (let i = 0; i < 3; i++) {
            await this.bc.getSignerCounters([]);
            const url = wsc.getURL();
            logger(`Fastest node at ${i}/3: ${url}`);
        }
        wsc.setParallel(1);
        logger("Done connecting")
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
