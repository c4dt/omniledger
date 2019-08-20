import "cross-fetch/polyfill";

import { Injectable } from "@angular/core";

import { ByzCoinRPC } from "@c4dt/cothority/byzcoin";

import Log from "@c4dt/cothority/log";
import { Config, Data } from "@c4dt/dynacred";
import { StorageDB } from "@c4dt/dynacred";

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

    constructor() {
        super(undefined); // poison
        this.storage = StorageDB;
    }

    async loadConfig(): Promise<void> {
        const res = await fetch("assets/config.toml");
        if (!res.ok) {
            return Promise.reject(`fetching config gave: ${res.status}: ${res.body}`);
        }
        const config = Config.fromTOML(await res.text());
        this.bc = await ByzCoinRPC.fromByzcoin(config.roster, config.byzCoinID);
    }

    async load() {
        Log.lvl1("Loading data from", this.dataFileName);
        const values = await this.storage.getObject(this.dataFileName);
        if (!values || values === {}) {
            throw new Error("No data available");
        }
        this.setValues(values);
        await this.connectByzcoin();
    }
}

// @ts-ignore
global.UserData = UserData;
