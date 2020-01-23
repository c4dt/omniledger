import {InstanceID} from "@dedis/cothority/byzcoin";
import {StateChangeBody} from "@dedis/cothority/byzcoin/proof";
import {SkipBlock} from "@dedis/cothority/skipchain";
import {BehaviorSubject, ReplaySubject} from "rxjs";
import {IDataBase} from "./tempdb";
import {ByzCoinSimul, IByzCoinProof} from "./byzcoin-simul";
import {distinctUntilChanged} from "rxjs/operators";
import {mergeMap} from "rxjs/internal/operators/mergeMap";
import Long = require("long");

export interface IInstance {
    key: InstanceID;
    value: Buffer;
    block: Long;
    contractID: string;
    version: Long;
    darcID: InstanceID;
}

export function newIInstance(key: InstanceID, value: Buffer, contractID?: string): IInstance {
    return {
        block: Long.fromNumber(-1),
        contractID: contractID || "unknown",
        darcID: Buffer.alloc(32),
        key, value,
        version: Long.fromNumber(0),
    };
}

export function printInstance(i: IInstance): string {
    return `{
    key: ${i.key.toString("hex")}
    value: ${i.value.slice(0, 100).toString("hex")}
    block: ${i.block.toNumber()}
    contractID: ${i.contractID}
    version: ${i.version.toNumber()}
    darcID: ${i.darcID.toString("hex")}
    }`;
}

export interface IProof {
    skipblock: SkipBlock;
    stateChangeBody: StateChangeBody;

    exists(key: Buffer): boolean;
}

export class Instances {
    private cache = new Map<InstanceID, ReplaySubject<IInstance>>();

    constructor(private db: IDataBase, private bc: IByzCoinProof, private newBlock: BehaviorSubject<Long>) {
    }

    public static async fromScratch(db: IDataBase, bc: IByzCoinProof): Promise<Instances> {
        const p = await bc.getProof(ByzCoinSimul.configInstanceID);
        const newBlock = new BehaviorSubject(Long.fromNumber(p.skipblock.index));
        return new Instances(db, bc, newBlock);
    }

    public instanceObservable(id: InstanceID): ReplaySubject<IInstance> {
        const bs = this.cache.get(id);
        if (bs !== undefined) {
            return bs;
        }

        const bsNew = new ReplaySubject<IInstance>(1);
        this.newBlock
            .pipe(
                mergeMap((v) => this.getInstanceFromChain(id)),
                distinctUntilChanged((a, b) => a.version.equals(b.version)))
            .subscribe({next: (inst) => bsNew.next(inst)});
        this.cache.set(id, bsNew);
        return bsNew;
    }

    public async reload(): Promise<void> {
        await this.getInstanceFromChain(ByzCoinSimul.configInstanceID);
    }

    private async getInstanceFromChain(id: InstanceID): Promise<IInstance> {
        const p = await this.bc.getProof(id);
        if (!p.exists(id)) {
            throw new Error("didn't find instance in cache or on chain");
        }
        const inst = {
            block: Long.fromNumber(p.skipblock.index),
            contractID: p.stateChangeBody.contractID,
            darcID: p.stateChangeBody.darcID,
            key: id,
            value: p.stateChangeBody.value,
            version: p.stateChangeBody.version,
        };
        if (!inst.block.equals(this.newBlock.getValue())) {
            this.newBlock.next(inst.block);
        }
        return inst;
    }
}
