import {personhood} from "@dedis/cothority";
import {curve, Point, Scalar} from "@dedis/kyber";
import {darc} from "@dedis/cothority";
const ed25519 = curve.newCurve("edwards25519");

export class KeyPair {

    public static rand(): KeyPair {
        return KeyPair.fromPrivate(ed25519.scalar().pick());
    }

    public static fromString(str: string): KeyPair {
        const priv = ed25519.scalar();
        priv.unmarshalBinary(Buffer.from(str, "hex"));
        return KeyPair.fromPrivate(priv);
    }

    public static fromPrivate(priv: Scalar | Buffer): KeyPair {
        if (priv instanceof Buffer) {
            if (priv.length !== ed25519.scalarLen()){
                throw new Error("private key must be of length " + ed25519.scalarLen());
            }
            const privBuf = priv;
            priv = ed25519.scalar();
            priv.unmarshalBinary(privBuf);
        }
        const pub = ed25519.point().mul(priv);
        return new KeyPair(priv, pub);
    }

    constructor(public priv: Scalar, public pub: Point) {
    }

    public toString(): string {
        return this.priv.marshalBinary().toString("hex");
    }

    public signer(): darc.SignerEd25519 {
        return new darc.SignerEd25519(this.pub, this.priv);
    }
}
