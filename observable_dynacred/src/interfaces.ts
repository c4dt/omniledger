import {IProof} from "./instances";
import Long from "long";
import {BehaviorSubject, Subject} from "rxjs";
import {AddTxResponse} from "@dedis/cothority/byzcoin/proto/requests";
import {ClientTransaction, InstanceID} from "@dedis/cothority/byzcoin";
import {IIdentity} from "@dedis/cothority/darc";
import {SkipBlock} from "@dedis/cothority/skipchain";

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
    getNewBlocks(): Promise<BehaviorSubject<SkipBlock>>;
}

export interface IDataBase {
    get(key: string): Promise<Buffer | undefined>;

    getObject<T>(key: string): Promise<T | undefined>;

    set(key: string, value: Buffer): Promise<void>;

    setObject<T>(key: string, obj: T): Promise<void>;
}

export let configInstanceID = Buffer.alloc(32);

