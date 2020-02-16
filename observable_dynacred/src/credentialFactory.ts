import {curve, Point, Scalar} from "@dedis/kyber";
import {byzcoin, calypso, darc, personhood} from "@dedis/cothority";
import Long = require("long");

import {CredentialStructBS} from "./credentialStructBS";
import {KeyPair} from "./keypair";
import {ICreateCost} from "@dedis/cothority/personhood";

const ed25519 = new curve.edwards25519.Curve();

export interface IGenesisDarc {
    keyPair: KeyPair;
    darc: darc.Darc;
}

export interface IUser {
    keyPair: KeyPair;
    cred: byzcoin.contracts.CredentialStruct;
    credID: byzcoin.InstanceID;
    coin: byzcoin.contracts.Coin;
    coinID: byzcoin.InstanceID;
    darcDevice: darc.Darc;
    darcSign: darc.Darc;
    darcCred: darc.Darc;
    darcCoin: darc.Darc;
}

export class CredentialFactory {

    public static genesisDarc(priv?: Scalar): IGenesisDarc {
        const keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [keyPair.signer()];
        const adminDarc = darc.Darc.createBasic(signer, signer,
            Buffer.from("AdminDarc"),
            ["spawn:spawner", "spawn:coin", "spawn:credential", "spawn:longTermSecret",
                "spawn:calypsoWrite", "spawn:calypsoRead", "spawn:darc",
                "invoke:coin.mint", "invoke:coin.transfer", "invoke:coin.fetch"]);
        return {keyPair, darc: adminDarc};
    }

    public static spawnerCost(): ICreateCost {
        const coin10 = Long.fromNumber(10);
        const coin100 = Long.fromNumber(100);
        const coin1000 = Long.fromNumber(1000);
        return {
            costCRead: coin100,
            costCWrite: coin1000,
            costCoin: coin100,
            costCredential: coin1000,
            costDarc: coin100,
            costParty: coin1000,
            costRoPaSci: coin10,
            costValue: coin10,
        };
    }

    public static lts() {
        //        const lts = await LongTermSecret.spawn(bc, adminDarcID, [adminSigner]);
    }

    public static coinID(pub: Point): byzcoin.InstanceID {
        return byzcoin.contracts.CoinInstance.coinIID(pub.marshalBinary());
    }

    public static credID(pub: Point): byzcoin.InstanceID{
        return byzcoin.contracts.CredentialsInstance.credentialIID(pub.marshalBinary());
    }

    public static prepareInitialCred(alias: string, pub: Point, spawner?: byzcoin.InstanceID, deviceDarcID?: byzcoin.InstanceID,
                                     lts?: calypso.LongTermSecret): byzcoin.contracts.CredentialStruct {
        const cred = new byzcoin.contracts.CredentialStruct();
        cred.setAttribute("1-public", "alias", Buffer.from(alias));
        cred.setAttribute("1-public", "coin", this.coinID(pub));
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

    public static newUser(alias: string, spawnerID: byzcoin.InstanceID,
                          priv?: Scalar): IUser {
        const keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [keyPair.signer()];

        const darcDevice = darc.Darc.createBasic(signer, signer, Buffer.from("device:initial"));
        const darcDeviceId = new darc.IdentityDarc({id: darcDevice.getBaseID()});
        const darcSign = darc.Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        const darcSignId = new darc.IdentityDarc({id: darcSign.getBaseID()});
        const darcCred = darc.Darc.createBasic([], [darcSignId], Buffer.from(byzcoin.contracts.CredentialsInstance.argumentCredential),
            ["invoke:" + byzcoin.contracts.CredentialsInstance.contractID + ".update"]);
        const rules = [byzcoin.contracts.CoinInstance.commandTransfer,
            byzcoin.contracts.CoinInstance.commandFetch,
            byzcoin.contracts.CoinInstance.commandStore].map((inv) => `invoke:${byzcoin.contracts.CoinInstance.contractID}.${inv}`);
        const darcCoin = darc.Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);
        const coin = new byzcoin.contracts.Coin({name: personhood.SPAWNER_COIN, value: Long.fromNumber(0)});
        const cred = this.prepareInitialCred(alias, keyPair.pub, spawnerID, darcDevice.getBaseID());

        return {
            keyPair, cred, darcDevice, darcSign, darcCred, darcCoin, coin,
            credID: this.credID(keyPair.pub), coinID: this.coinID(keyPair.pub)
        };
    }
}
