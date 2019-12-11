import { curve, Point, PointFactory } from "@dedis/kyber";
import { Buffer } from "buffer";
import { randomBytes } from "crypto-browserify";

const curve25519 = curve.newCurve("edwards25519");

/**
 * KeyPair holds the private and public key that go together. It has
 * convenience methods to initialize and print the private and public
 * key.
 */
export class KeyPair {

    static fromBuffer(priv: any): KeyPair {
        return new KeyPair(Buffer.from(priv).toString("hex"));
    }

    static fromObject(obj: any) {
        return new KeyPair(Private.fromBuffer(obj.priv).toHex());
    }
    _private: Private;
    _public: Public;

    constructor(privHex: string = "") {
        if (privHex && privHex.length === 64) {
            this.setPrivateHex(privHex);
        } else {
            this.randomize();
        }
    }

    setPrivateHex(privHex: string) {
        this.setPrivate(Private.fromHex(privHex));
    }

    setPrivate(priv: Private) {
        this._private = priv;
        this._public = new Public(curve25519.point().mul(this._private.scalar));
    }

    randomize() {
        this.setPrivate(Private.fromRand());
    }

    toObject(): any {
        return {
            priv: this._private.toBuffer(),
            pub: this._public.toBuffer(),
        };
    }
}

export class Private {

    static fromBuffer(buf: Buffer): Private {
        const p = curve25519.scalar();
        p.unmarshalBinary(buf);
        return new Private(p);
    }

    static fromHex(hex: string): Private {
        return Private.fromBuffer(Buffer.from(hex, "hex"));
    }

    static zero(): Private {
        const p = curve25519.scalar();
        p.zero();
        return new Private(p);
    }

    static one(): Private {
        const p = curve25519.scalar();
        p.one();
        return new Private(p);
    }

    static fromRand(): Private {
        return new Private(curve25519.scalar().setBytes(randomBytes(32)));
    }
    constructor(public scalar: any) {
    }

    toHex(): string {
        return this.toBuffer().toString("hex");
    }

    toBuffer(): Buffer {
        return Buffer.from(this.scalar.marshalBinary());
    }

    equal(p: Private | undefined): boolean {
        if (p === undefined) {
            return false;
        }
        return this.scalar.equal(p.scalar);
    }

    add(p: Private): Private {
        return new Private(curve25519.scalar().add(this.scalar, p.scalar));
    }
}

export class Public {

    static base(): Public {
        const p = curve25519.point();
        p.base();
        return new Public(p);
    }

    static fromBuffer(buf: Buffer): Public {
        const p = curve25519.point();
        p.unmarshalBinary(buf);
        return new Public(p);
    }

    static fromProto(buf: Buffer): Public {
        return new Public(PointFactory.fromProto(buf));
    }

    static fromHex(hex: string): Public {
        return Public.fromBuffer(Buffer.from(hex, "hex"));
    }

    static zero(): Public {
        const p = curve25519.point();
        p.null();
        return new Public(p);
    }

    static fromRand(): Public {
        const kp = new KeyPair();
        return kp._public;
    }
    constructor(public point: Point) {
    }

    equal(p: Public | undefined): boolean {
        if (p === undefined) {
            return false;
        }
        return this.point.equals(p.point);
    }

    toHex(): string {
        return this.toBuffer().toString("hex");
    }

    toBuffer(): Buffer {
        return Buffer.from(this.point.marshalBinary());
    }

    toProto(): Buffer {
        return Buffer.from(this.point.toProto());
    }

    mul(s: Private): Public {
        const ret = curve25519.point();
        ret.mul(s.scalar, this.point);
        return new Public(ret);
    }

    add(p: Public): Public {
        return new Public(curve25519.point().add(this.point, p.point));
    }
}
