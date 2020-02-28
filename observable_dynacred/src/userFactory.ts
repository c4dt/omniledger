import {curve, Point, Scalar} from "@dedis/kyber";
import {
    Coin,
    CoinInstance, CredentialsInstance,
    CredentialStruct, SPAWNER_COIN
} from "@dedis/cothority/byzcoin/contracts";

import {CredentialStructBS} from "./credentialStructBS";
import {KeyPair} from "./keypair";
import Long from "long";
import {InstanceID} from "@dedis/cothority/byzcoin";
import {Darc, IdentityDarc} from "@dedis/cothority/darc";
import {LongTermSecret} from "@dedis/cothority/calypso";

const ed25519 = new curve.edwards25519.Curve();

export class UserFactory {
    public keyPair: KeyPair;
    public cred: CredentialStruct;
    public coin: Coin;
    public darcDevice: Darc;
    public darcSign: Darc;
    public darcCred: Darc;
    public darcCoin: Darc;

    constructor(alias: string, spawnerID: InstanceID, priv?: Scalar) {
        this.keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [this.keyPair.signer()];

        this.darcDevice = Darc.createBasic(signer, signer, Buffer.from("device:initial"));
        const darcDeviceId = new IdentityDarc({id: this.darcDevice.getBaseID()});
        this.darcSign = Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        const darcSignId = new IdentityDarc({id: this.darcSign.getBaseID()});
        this.darcCred = Darc.createBasic([], [darcSignId], Buffer.from(CredentialsInstance.argumentCredential),
            ["invoke:" + CredentialsInstance.contractID + ".update"]);
        const rules = [CoinInstance.commandTransfer,
            CoinInstance.commandFetch,
            CoinInstance.commandStore].map((inv) => `invoke:${CoinInstance.contractID}.${inv}`);
        this.darcCoin = Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);
        const coin = new Coin({
            name: SPAWNER_COIN,
            value: Long.fromNumber(0)
        });
        this.cred = UserFactory.prepareInitialCred(alias, this.keyPair.pub, spawnerID, this.darcDevice.getBaseID());
    }


    public static prepareInitialCred(alias: string, pub: Point, spawner?: InstanceID, deviceDarcID?: InstanceID,
                                     lts?: LongTermSecret): CredentialStruct {
        const cred = new CredentialStruct();
        cred.setAttribute("1-public", "alias", Buffer.from(alias));
        cred.setAttribute("1-public", "coin",
            CoinInstance.coinIID(pub.marshalBinary()));
        cred.setAttribute("1-public", "version", Buffer.from(Long.fromNumber(0).toBytesLE()));
        cred.setAttribute("1-public", "seedPub", pub.marshalBinary());
        cred.setAttribute("1-config", "spawner", spawner);
        const svBuf = Buffer.alloc(4);
        svBuf.writeInt32LE(CredentialStructBS.structVersionLatest, 0);
        cred.setAttribute("1-config", "structVersion", svBuf);
        cred.setAttribute("1-devices", "initial", deviceDarcID);
        if (lts) {
            cred.setAttribute("1-config", "ltsID", lts.id);
            cred.setAttribute("1-config", "ltsX", lts.X.toProto());
        }
        return cred;
    }

    get credID(): InstanceID{
        return CredentialsInstance.credentialIID(this.keyPair.pub.marshalBinary());
    }

    get coinID(): InstanceID{
        return CoinInstance.coinIID(this.keyPair.pub.marshalBinary());
    }
}
