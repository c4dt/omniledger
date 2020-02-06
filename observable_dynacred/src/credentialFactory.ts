import {curve, Point, Scalar} from "@dedis/kyber";
import {byzcoin, calypso, darc} from "@dedis/cothority";
import Long = require("long");
import {randomBytes} from "crypto";

import {Credentials} from "src/credentials";
import {KeyPair} from "src/keypair";
import {IGenesisDarc, ISpawner, IUser} from "spec/simul/itest";

const {Darc} = darc;
const {Coin, CoinInstance, CredentialsInstance, CredentialStruct, SpawnerStruct, SPAWNER_COIN} = byzcoin.contracts;
type Darc = darc.Darc;
type CredentialStruct = byzcoin.contracts.CredentialStruct;
type LongTermSecret = calypso.LongTermSecret;
type InstanceID = byzcoin.InstanceID;
const ed25519 = curve.newCurve("edwards25519");

export class CredentialFactory {

    public static genesisDarc(priv?: Scalar): IGenesisDarc {
        const keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [keyPair.signer()];
        const adminDarc = Darc.createBasic(signer, signer,
            Buffer.from("AdminDarc"),
            ["spawn:spawner", "spawn:coin", "spawn:credential", "spawn:longTermSecret",
                "spawn:calypsoWrite", "spawn:calypsoRead", "spawn:darc",
                "invoke:coin.mint", "invoke:coin.transfer", "invoke:coin.fetch"]);
        return {keyPair, darc: adminDarc};
    }

    public static spawner(gu: IGenesisDarc): ISpawner {
        const coin = new Coin({
            name: SPAWNER_COIN,
            value: Long.fromNumber(1e9)
        });
        const coin10 = new Coin({
            name: SPAWNER_COIN,
            value: Long.fromNumber(10)
        });
        const coin100 = new Coin({
            name: SPAWNER_COIN,
            value: Long.fromNumber(100)
        });
        const coin1000 = new Coin({
            name: SPAWNER_COIN,
            value: Long.fromNumber(1000)
        });
        const spawner = new SpawnerStruct({
            costCRead: coin100,
            costCWrite: coin1000,
            costCoin: coin100,
            costCredential: coin1000,
            costDarc: coin100,
            costParty: coin1000,
            costRoPaSci: coin10,
            costValue: coin10,
        });
        return {
            coin, spawner,
            coinID: Buffer.from(randomBytes(32)),
            spawnerID: Buffer.from(randomBytes(32))
        };
    }

    public static lts() {
        //        const lts = await LongTermSecret.spawn(bc, adminDarcID, [adminSigner]);
    }

    public static coinID(pub: Point): InstanceID {
        return CoinInstance.coinIID(pub.marshalBinary());
    }

    public static credID(pub: Point): InstanceID{
        return CredentialsInstance.credentialIID(pub.marshalBinary());
    }

    public static prepareInitialCred(alias: string, pub: Point, spawner?: byzcoin.InstanceID, deviceDarcID?: byzcoin.InstanceID,
                                     lts?: LongTermSecret): CredentialStruct {
        const cred = new CredentialStruct();
        cred.setAttribute("1-public", "alias", Buffer.from(alias));
        cred.setAttribute("1-public", "coin", this.coinID(pub));
        cred.setAttribute("1-public", "version", Buffer.from(Long.fromNumber(0).toBytesLE()));
        cred.setAttribute("1-public", "seedPub", pub.marshalBinary());
        cred.setAttribute("1-config", "spawner", spawner);
        const svBuf = Buffer.alloc(4);
        svBuf.writeInt32LE(Credentials.structVersionLatest, 0);
        cred.setAttribute("1-config", "structVersion", svBuf);
        cred.setAttribute("1-devices", "initial", deviceDarcID);
        if (lts) {
            cred.setAttribute("1-config", "ltsID", lts.id);
            cred.setAttribute("1-config", "ltsX", lts.X.toProto());
        }
        return cred;
    }

    public static newUser(alias: string, spawnerID: byzcoin.InstanceID,
                          priv?: Scalar): IUser {
        const keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [keyPair.signer()];

        const darcDevice = Darc.createBasic(signer, signer, Buffer.from("device"));
        const darcDeviceId = new darc.IdentityDarc({id: darcDevice.getBaseID()});
        const darcSign = Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        const darcSignId = new darc.IdentityDarc({id: darcSign.getBaseID()});
        const darcCred = Darc.createBasic([], [darcSignId], Buffer.from(CredentialsInstance.argumentCredential),
            ["invoke:" + CredentialsInstance.contractID + ".update"]);
        const rules = [CoinInstance.commandTransfer,
            CoinInstance.commandFetch,
            CoinInstance.commandStore].map((inv) => `invoke:${CoinInstance.contractID}.${inv}`);
        const darcCoin = Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);
        const coin = new Coin({name: SPAWNER_COIN, value: Long.fromNumber(0)});
        const cred = this.prepareInitialCred(alias, keyPair.pub, spawnerID, darcDevice.getBaseID());

        return {
            keyPair, cred, darcDevice, darcSign, darcCred, darcCoin, coin,
            credID: this.credID(keyPair.pub), coinID: this.coinID(keyPair.pub)
        };
    }
}
