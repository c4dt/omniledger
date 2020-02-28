import {InstanceMap} from "src/credentialStructBS";
import {Credential} from "@dedis/cothority/byzcoin/contracts";

describe("testing map", () => {
    it("making new", () => {
        const c = new Credential();
        const m = new InstanceMap(c);
        expect(m).toBeDefined();
    });
});
