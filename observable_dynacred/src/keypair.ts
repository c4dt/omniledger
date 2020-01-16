import {SignerEd25519} from "@dedis/cothority/darc";
import {ed25519} from "@dedis/cothority/personhood/ring-sig";
import {Point, Scalar} from "@dedis/kyber";

export class KeyPair {

    public static rand(): KeyPair {
        return KeyPair.fromPrivate(ed25519.scalar().pick());
    }

    public static fromString(str: string): KeyPair {
        const priv = ed25519.scalar();
        priv.unmarshalBinary(Buffer.from(str, "hex"));
        return KeyPair.fromPrivate(priv);
    }

    public static fromPrivate(priv: Scalar): KeyPair {
        const pub = ed25519.point().mul(priv);
        return new KeyPair(priv, pub);
    }

    constructor(public priv: Scalar, public pub: Point) {
    }

    public toString(): string {
        return this.priv.marshalBinary().toString("hex");
    }

    public signer(): SignerEd25519 {
        return new SignerEd25519(this.pub, this.priv);
    }
}
