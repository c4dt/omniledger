import { Injectable } from "@angular/core";

import "cross-fetch/polyfill";

import { Config, Data } from "@c4dt/dynacred";

@Injectable({
    providedIn: "root",
})
/**
 * UserData can be used as a global data in the app. However, when using it outside
 * of the UI, it is important to always pass the data, so that it is simpler to
 * test the libraries.
 */
export class UserData extends Data {
    config: Config; // trick to allow writing to Data.config

    constructor() {
        super(undefined); // poison
    }

    async load(): Promise<any> {
        const res = await fetch("assets/config.toml");
        if (!res.ok) {
            return Promise.reject(`fetching config gave: ${res.status}: ${res.body}`);
        }
        this.config = Config.fromTOML(await res.text());

        await super.load();
    }
}

// @ts-ignore
global.UserData = UserData;
