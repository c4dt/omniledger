import {curve, Point, Scalar} from "@dedis/kyber";
import {byzcoin, calypso, darc, personhood} from "@dedis/cothority";
import {
    Coin,
    CoinInstance, CredentialsInstance,
    CredentialStruct
} from "@dedis/cothority/byzcoin/contracts";

import {CredentialStructBS} from "./credentialStructBS";
import {KeyPair} from "./keypair";
import Long = require("long");
import {InstanceID} from "@c4dt/cothority/byzcoin";

const ed25519 = new curve.edwards25519.Curve();

export class UserFactory {
    public keyPair: KeyPair;
    public cred: CredentialStruct;
    public coin: Coin;
    public darcDevice: darc.Darc;
    public darcSign: darc.Darc;
    public darcCred: darc.Darc;
    public darcCoin: darc.Darc;

    constructor(alias: string, spawnerID: InstanceID, priv?: Scalar) {
        this.keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [this.keyPair.signer()];

        this.darcDevice = darc.Darc.createBasic(signer, signer, Buffer.from("device:initial"));
        const darcDeviceId = new darc.IdentityDarc({id: this.darcDevice.getBaseID()});
        this.darcSign = darc.Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        const darcSignId = new darc.IdentityDarc({id: this.darcSign.getBaseID()});
        this.darcCred = darc.Darc.createBasic([], [darcSignId], Buffer.from(byzcoin.contracts.CredentialsInstance.argumentCredential),
            ["invoke:" + byzcoin.contracts.CredentialsInstance.contractID + ".update"]);
        const rules = [byzcoin.contracts.CoinInstance.commandTransfer,
            byzcoin.contracts.CoinInstance.commandFetch,
            byzcoin.contracts.CoinInstance.commandStore].map((inv) => `invoke:${byzcoin.contracts.CoinInstance.contractID}.${inv}`);
        this.darcCoin = darc.Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);
        const coin = new byzcoin.contracts.Coin({
            name: personhood.SPAWNER_COIN,
            value: Long.fromNumber(0)
        });
        this.cred = UserFactory.prepareInitialCred(alias, this.keyPair.pub, spawnerID, this.darcDevice.getBaseID());
    }


    public static prepareInitialCred(alias: string, pub: Point, spawner?: byzcoin.InstanceID, deviceDarcID?: byzcoin.InstanceID,
                                     lts?: calypso.LongTermSecret): CredentialStruct {
        const cred = new byzcoin.contracts.CredentialStruct();
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
