import Long = require("long");
import {KeyPair} from "../src/keypair";
import {Darc, IdentityDarc} from "@dedis/cothority/darc";
import CoinInstance, {Coin} from "@dedis/cothority/byzcoin/contracts/coin-instance";
import {
    SPAWNER_COIN,
    SpawnerStruct
} from "@dedis/cothority/personhood/spawner-instance";
import {Point} from "@dedis/kyber";
import {InstanceID} from "@dedis/cothority/byzcoin";
import {LongTermSecret} from "@dedis/cothority/calypso";
import CredentialInstance, {CredentialStruct} from "@dedis/cothority/personhood/credentials-instance";
import {Credentials, IGenesisUser, ISpawner, IUser} from "./credentials";
import {randomBytes} from "crypto";

export class CredentialFactory {

    public static genesisUser(): IGenesisUser {
        const keyPair = KeyPair.rand();
        const signer = [keyPair.signer()];
        const darc = Darc.createBasic(signer, signer,
            Buffer.from("AdminDarc"),
            ["spawn:spawner", "spawn:coin", "spawn:credential", "spawn:longTermSecret",
                "spawn:calypsoWrite", "spawn:calypsoRead", "spawn:darc",
                "invoke:coin.mint", "invoke:coin.transfer", "invoke:coin.fetch"]);
        return {keyPair, darc};
    }

    public static spawner(gu: IGenesisUser): ISpawner {
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

    public static prepareInitialCred(alias: string, pub: Point, spawner?: InstanceID, deviceDarcID?: InstanceID,
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

    public static newUser(alias: string, spawnerID: InstanceID): IUser {
        const keyPair = KeyPair.rand();
        const signer = [keyPair.signer()];

        const darcDevice = Darc.createBasic(signer, signer, Buffer.from("device"));
        const darcDeviceId = new IdentityDarc({id: darcDevice.getBaseID()});
        const darcSign = Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        const darcSignId = new IdentityDarc({id: darcSign.getBaseID()});
        const darcCred = Darc.createBasic([], [darcSignId], Buffer.from(CredentialInstance.argumentCredential),
            ["invoke:" + CredentialInstance.contractID + ".update"]);
        const rules = [CoinInstance.commandMint, CoinInstance.commandTransfer, CoinInstance.commandFetch,
            CoinInstance.commandStore].map((inv) => `invoke:${CoinInstance.contractID}.#{inv}`);
        const darcCoin = Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);
        const coin = new Coin({name: SPAWNER_COIN, value: Long.fromNumber(0)});
        const cred = this.prepareInitialCred(alias, keyPair.pub, spawnerID, darcDevice.getBaseID());

        return {
            keyPair, cred, darcDevice, darcSign, darcCred, darcCoin, coin,
            credID: randomBytes(32), coinID: randomBytes(32)
        };
    }
}
