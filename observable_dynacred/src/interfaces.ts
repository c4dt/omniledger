import {IProof} from "./instances";
import {byzcoin, darc, skipchain} from "@dedis/cothority";
import Long from "long";
import {Subject} from "rxjs";
import {AddTxResponse} from "@dedis/cothority/byzcoin/proto/requests";

type IIdentity = darc.IIdentity;
type InstanceID = byzcoin.InstanceID;
type ClientTransaction = byzcoin.ClientTransaction;

export interface IByzCoinProof {
    getProofFromLatest(inst: InstanceID): Promise<IProof>;
}

export interface IByzCoinAddTransaction {
    sendTransactionAndWait(tx: ClientTransaction, wait?: number): Promise<AddTxResponse>;
    getSignerCounters(signers: IIdentity[], increment: number): Promise<Long[]>;
    updateCachedCounters(signers: IIdentity[]): Promise<Long[]>;
    getNextCounter(signer: IIdentity): Long;
    getProtocolVersion(): number;
}

export interface IByzCoinBlockStreamer {
    getNewBlocks(): Subject<skipchain.SkipBlock>;
}

export interface IDataBase {
    get(key: string): Promise<Buffer | undefined>;

    getObject<T>(key: string): Promise<T | undefined>;

    set(key: string, value: Buffer): Promise<void>;

    setObject<T>(key: string, obj: T): Promise<void>;
}

export let configInstanceID = Buffer.alloc(32);

