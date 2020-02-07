import { Point, Scalar } from "@dedis/kyber";
import { byzcoin, calypso, darc } from "@dedis/cothority";
import { KeyPair } from "./keypair";
export interface IGenesisDarc {
    keyPair: KeyPair;
    darc: darc.Darc;
}
export interface ISpawner {
    coin: byzcoin.contracts.Coin;
    coinID: byzcoin.InstanceID;
    spawner: byzcoin.contracts.SpawnerStruct;
    spawnerID: byzcoin.InstanceID;
    spawnerInstance?: byzcoin.contracts.SpawnerInstance;
    coinInstance?: byzcoin.contracts.CoinInstance;
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
export declare class CredentialFactory {
    static genesisDarc(priv?: Scalar): IGenesisDarc;
    static spawner(gu: IGenesisDarc): ISpawner;
    static lts(): void;
    static coinID(pub: Point): byzcoin.InstanceID;
    static credID(pub: Point): byzcoin.InstanceID;
    static prepareInitialCred(alias: string, pub: Point, spawner?: byzcoin.InstanceID, deviceDarcID?: byzcoin.InstanceID, lts?: calypso.LongTermSecret): byzcoin.contracts.CredentialStruct;
    static newUser(alias: string, spawnerID: byzcoin.InstanceID, priv?: Scalar): IUser;
}
