import {KeyPair} from "src/keypair";
import {Darc} from "@dedis/cothority/darc";
import {Coin} from "@dedis/cothority/byzcoin/contracts/coin-instance";
import {InstanceID} from "@dedis/cothority/byzcoin";
import {SpawnerStruct} from "@dedis/cothority/personhood/spawner-instance";
import {CredentialStruct} from "@dedis/cothority/personhood/credentials-instance";
import {IProof} from "src/instances";

export interface IGenesisDarc {
    keyPair: KeyPair;
    darc: Darc;
}

export interface ISpawner {
    coin: Coin;
    coinID: InstanceID;
    spawner: SpawnerStruct;
    spawnerID: InstanceID;
}

export interface IUser {
    keyPair: KeyPair;
    cred: CredentialStruct;
    credID: InstanceID;
    coin: Coin;
    coinID: InstanceID;
    darcDevice: Darc;
    darcSign: Darc;
    darcCred: Darc;
    darcCoin: Darc;
}

export interface IByzCoinProof {
    getProof(inst: InstanceID): Promise<IProof>;
}

export interface IByzCoinAddTransaction {
    addTransaction(tx: ITransaction): Promise<void>;
}

export interface ITransaction {
    spawn?: ISpawnTransaction;
    update?: IUpdateTransaction;
    delete?: IDeleteTransaction;
}

export interface IUpdateTransaction {
    instID: InstanceID;
    value: Buffer;
}

export interface ISpawnTransaction {
    instID: InstanceID;
    value: Buffer;
}

export interface IDeleteTransaction {
    instID: InstanceID;
}

export interface IDataBase {
    get(key: string): Promise<Buffer | undefined>;

    getObject<T>(key: string): Promise<T | undefined>;

    set(key: string, value: Buffer): Promise<void>;

    setObject<T>(key: string, obj: T): Promise<void>;
}

export let configInstanceID = Buffer.alloc(32);
