/// <reference types="node" />
import { Point, Scalar } from "@dedis/kyber";
import { darc } from "@dedis/cothority";
export declare class KeyPair {
    priv: Scalar;
    pub: Point;
    static rand(): KeyPair;
    static fromString(str: string): KeyPair;
    static fromPrivate(priv: Scalar | Buffer): KeyPair;
    constructor(priv: Scalar, pub: Point);
    toString(): string;
    signer(): darc.SignerEd25519;
}
