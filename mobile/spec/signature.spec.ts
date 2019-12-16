// tslint:disable-next-line
require("nativescript-nodeify");

import { curve } from "@dedis/kyber";
import { schnorr } from "@dedis/kyber/sign";
import { createHash } from "crypto-browserify";
import { KeyPair } from "../app/lib/dynacred";

const ed25519 = curve.newCurve("edwards25519");

describe("Kyber usage, know how to", () => {
    it("sign a message", () => {
        const user1 = new KeyPair();
        const user2 = new KeyPair();

        const msg = "Some message to be signed";
        const msgHasher = createHash("sha256");
        msgHasher.update(Buffer.from(msg));
        const msgHash = msgHasher.digest();

        const sig = schnorr.sign(ed25519, user1._private.scalar, msgHash);

        expect(schnorr.verify(ed25519, user1._public.point, msgHash, sig)).toBeTruthy();
        expect(schnorr.verify(ed25519, user2._public.point, msgHash, sig)).toBeFalsy();
    });
});
