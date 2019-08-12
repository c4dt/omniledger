import * as http from "http";

import { Config } from "../src";

describe("Config", async () => {
    it("can be constructed with a trivial toml", async () => {
        // TODO empty list of servers fails
        // tslint:disable-next-line:no-unused-expression
        Config.fromTOML(`
            ByzCoinID = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
            [[servers]]
                Address = "tls://localhost"
                Url = "https://localhost"
                Suite = "Ed25519"
                Public = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
                Description = "irrelevant"
        `);
    });
});
