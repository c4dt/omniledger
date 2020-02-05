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
type ClientTransaction = byzcoin.ClientTransaction;

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
    addTransaction(tx: ClientTransaction): Promise<void>;
}

export interface IDataBase {
    get(key: string): Promise<Buffer | undefined>;

    getObject<T>(key: string): Promise<T | undefined>;

    set(key: string, value: Buffer): Promise<void>;

    setObject<T>(key: string, obj: T): Promise<void>;
}

export let configInstanceID = Buffer.alloc(32);
