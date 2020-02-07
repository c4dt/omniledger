"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var kyber_1 = require("@dedis/kyber");
var cothority_1 = require("@dedis/cothority");
var ed25519 = kyber_1.curve.newCurve("edwards25519");
var KeyPair = /** @class */ (function () {
    function KeyPair(priv, pub) {
        this.priv = priv;
        this.pub = pub;
    }
    KeyPair.rand = function () {
        return KeyPair.fromPrivate(ed25519.scalar().pick());
    };
    KeyPair.fromString = function (str) {
        var priv = ed25519.scalar();
        priv.unmarshalBinary(Buffer.from(str, "hex"));
        return KeyPair.fromPrivate(priv);
    };
    KeyPair.fromPrivate = function (priv) {
        if (priv instanceof Buffer) {
            if (priv.length !== ed25519.scalarLen()) {
                throw new Error("private key must be of length " + ed25519.scalarLen());
            }
            var privBuf = priv;
            priv = ed25519.scalar();
            priv.unmarshalBinary(privBuf);
        }
        var pub = ed25519.point().mul(priv);
        return new KeyPair(priv, pub);
    };
    KeyPair.prototype.toString = function () {
        return this.priv.marshalBinary().toString("hex");
    };
    KeyPair.prototype.signer = function () {
        return new cothority_1.darc.SignerEd25519(this.pub, this.priv);
    };
    return KeyPair;
}());
exports.KeyPair = KeyPair;
