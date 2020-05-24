import { Credential } from "@dedis/cothority/byzcoin/contracts";

import { InstanceMap } from "src/credentialStructBS";

// This is to make sure changes between es5 (cannot extend Map) and es6 (can extend Map) will be still running.

describe("testing map", () => {
    it("making new", () => {
        const c = new Credential();
        const m = new InstanceMap(c);
        expect(m).toBeDefined();
    });
});
