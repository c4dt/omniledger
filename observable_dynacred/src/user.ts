import {InstanceID} from "@dedis/cothority/byzcoin";
import {ed25519} from "@dedis/cothority/personhood/ring-sig";
import {Credentials} from "./credentials";
import {Instances} from "./instances";
import {KeyPair} from "./keypair";
import {IDataBase} from "./tempdb";
import {Log} from "@dedis/cothority";

// The user class is to be used only once for a given DB. It is unique for
// one URL-domain and represents the logged in user.
export class User {
    public static readonly keyPriv = "private";
    public static readonly keyCredID = "credID";

    constructor(private db: IDataBase, public readonly credential: Credentials,
                public kp: KeyPair, public id: InstanceID) {
    }

    public static async load(db: IDataBase, inst: Instances): Promise<User> {
        const privBuf = await db.get(this.keyPriv);
        if (privBuf === undefined) {
            throw new Error("no private key stored");
        }
        const id = await db.get(this.keyCredID);
        if (id === undefined) {
            throw new Error("no credentialID stored");
        }

        const priv = ed25519.scalar();
        priv.unmarshalBinary(privBuf);
        const kp = KeyPair.fromPrivate(priv);
        const cred = await Credentials.fromScratch(inst, id);
        return new User(db, cred, kp, id);
    }

    public async save(): Promise<void> {
        await this.db.set(User.keyPriv, this.kp.priv.marshalBinary());
        await this.db.set(User.keyCredID, this.id);
    }
}
