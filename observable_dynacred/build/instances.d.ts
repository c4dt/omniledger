/// <reference types="node" />
import { BehaviorSubject, Observable } from "rxjs";
import Long from "long";
import { byzcoin, skipchain } from "@dedis/cothority";
import { IByzCoinProof, IDataBase } from "./interfaces";
declare type InstanceID = byzcoin.InstanceID;
declare type SkipBlock = skipchain.SkipBlock;
declare type StateChangeBody = byzcoin.StateChangeBody;
export interface IInstance {
    key: InstanceID;
    value: Buffer;
    block: Long;
    contractID: string;
    version: Long;
    darcID: InstanceID;
}
export declare function newIInstance(key: InstanceID, value: Buffer, contractID?: string): IInstance;
export declare function printInstance(i: IInstance): string;
export interface IProof {
    latest: SkipBlock;
    stateChangeBody: StateChangeBody;
    exists(key: Buffer): boolean;
}
export declare class Instances {
    private db;
    private bc;
    private newBlock;
    static readonly dbKeyBlockIndex = "instance_block_index";
    private cache;
    constructor(db: IDataBase, bc: IByzCoinProof, newBlock: BehaviorSubject<Long>);
    static fromScratch(db: IDataBase, bc: IByzCoinProof): Promise<Instances>;
    instanceObservable(id: InstanceID): Promise<Observable<IInstance>>;
    reload(): Promise<void>;
    private getInstanceFromChain;
}
export {};
