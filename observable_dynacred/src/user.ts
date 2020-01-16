import {InstanceID} from "@dedis/cothority/byzcoin";
import {ed25519} from "@dedis/cothority/personhood/ring-sig";
import {CredentialObservable} from "./credentialObservable";
import {Instances} from "./instances";
import {KeyPair} from "./keypair";
import {IDataBase} from "./tempdb";
import {Log} from "@dedis/cothority";

export class User {
    public static async load(db: IDataBase, inst: Instances): Promise<User> {
        const privBuf =  await db.get(this.keyPriv);
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
        const u = new User(db, inst, kp, id);
        return u;
    }

    private static keyPriv = "private";
    private static keyCredID = "credID";

    constructor(private db: IDataBase, private inst: Instances, public kp: KeyPair, public id: InstanceID) {
        Log.print("our id is:", id);
    }

    public async save(): Promise<void> {
        await this.db.set(User.keyPriv, this.kp.priv.marshalBinary());
        await this.db.set(User.keyCredID, this.id);
    }

    public async getCredential(): Promise<CredentialObservable> {
        return new CredentialObservable(await this.inst.getInstance(this.id));
    }
}
