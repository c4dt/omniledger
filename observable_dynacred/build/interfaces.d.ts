/// <reference types="node" />
import { IProof } from "./instances";
import { byzcoin, darc } from "@dedis/cothority";
import Long from "long";
declare type IIdentity = darc.IIdentity;
declare type InstanceID = byzcoin.InstanceID;
declare type ClientTransaction = byzcoin.ClientTransaction;
export interface IByzCoinProof {
    getProof(inst: InstanceID): Promise<IProof>;
}
export interface IByzCoinAddTransaction {
    sendTransactionAndWait(tx: ClientTransaction): Promise<void>;
    getSignerCounters(signers: IIdentity[], increment: number): Promise<Long[]>;
    updateCachedCounters(signers: IIdentity[]): Promise<Long[]>;
    getNextCounter(signer: IIdentity): Long;
}
export interface IDataBase {
    get(key: string): Promise<Buffer | undefined>;
    getObject<T>(key: string): Promise<T | undefined>;
    set(key: string, value: Buffer): Promise<void>;
    setObject<T>(key: string, obj: T): Promise<void>;
}
export declare let configInstanceID: Buffer;
export {};
