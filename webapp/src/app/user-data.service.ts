import "cross-fetch/polyfill";

import { Injectable } from "@angular/core";

import { ByzCoinRPC } from "@dedis/cothority/byzcoin";

import Log from "@dedis/cothority/log";
import { Config, Data } from "@c4dt/dynacred";
import { StorageDB } from "@c4dt/dynacred/Storage";

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
        Log.lvl1("Loading data from", name);
        const values = await this.storage.getObject(name);
        if (!values || values === {}) {
            throw new Error("No data available");
        }
        const d = new Data(this.bc, values);
        if (d.contact && await d.contact.isRegisteredByzCoin(this.bc)) {
            await d.connectByzcoin();
        }
        d.storage = StorageDB;
    }
}

// @ts-ignore
global.UserData = UserData;
