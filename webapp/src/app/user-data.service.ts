import { Injectable } from "@angular/core";

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
    constructor(config: Config) {
        super(config);
    }
}

// @ts-ignore
global.UserData = UserData;
