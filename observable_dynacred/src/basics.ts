import {KeyPair} from "src/keypair";
import {IProof} from "src/instances";
import {byzcoin, darc} from "@dedis/cothority";

type Darc = darc.Darc;
type Coin = byzcoin.contracts.Coin;
type InstanceID = byzcoin.InstanceID;
type SpawnerStruct = byzcoin.contracts.SpawnerStruct;
type CredentialStruct = byzcoin.contracts.CredentialStruct;
type SpawnerInstance = byzcoin.contracts.SpawnerInstance;
type CoinInstance = byzcoin.contracts.CoinInstance;

export interface IGenesisDarc {
    keyPair: KeyPair;
    darc: Darc;
}

export interface ISpawner {
    coin: Coin;
    coinID: InstanceID;
    spawner: SpawnerStruct;
    spawnerID: InstanceID;
    spawnerInstance?: SpawnerInstance;
    coinInstance?: CoinInstance;
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
