import {InstanceID} from "@dedis/cothority/byzcoin";
import {StateChangeBody} from "@dedis/cothority/byzcoin/proof";
import {SkipBlock} from "@dedis/cothority/skipchain";
import {BehaviorSubject, Observable, ReplaySubject} from "rxjs";
import {IDataBase} from "./tempdb";
import {ByzCoinSimul, IByzCoinProof} from "./byzcoin-simul";
import {distinctUntilChanged} from "rxjs/operators";
import {mergeMap} from "rxjs/internal/operators/mergeMap";
import {filter} from "rxjs/internal/operators/filter";
import Long = require("long");
import {Log} from "@dedis/cothority";

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
    public static readonly dbKeyBlockIndex = "instance_block_index";
    private cache = new Map<InstanceID, ReplaySubject<IInstance>>();

    constructor(private db: IDataBase, private bc: IByzCoinProof, private newBlock: BehaviorSubject<Long>) {
    }

    public static async fromScratch(db: IDataBase, bc: IByzCoinProof): Promise<Instances> {
        const blockIndexBuf = await db.get(Instances.dbKeyBlockIndex);
        let blockIndex = Long.fromNumber(-1);
        if (blockIndexBuf !== undefined) {
            blockIndex = Long.fromBytes(Array.from(blockIndexBuf));
        } else {
            const p = await bc.getProof(ByzCoinSimul.configInstanceID);
            blockIndex = Long.fromNumber(p.skipblock.index);
        }
        const newBlock = new BehaviorSubject(blockIndex);
        return new Instances(db, bc, newBlock);
    }

    public async instanceObservable(id: InstanceID): Promise<Observable<IInstance>> {
        const bs = this.cache.get(id);
        if (bs !== undefined) {
            return bs;
        }

        const bsNew = new ReplaySubject<IInstance>(1);

        // Check if the db already has a version, which might be invalid,
        // but still better than to wait for the network.
        let lastBlock = Long.fromNumber(-1);
        const dbInst: IInstance | undefined = await this.db.getObject(id.toString("hex"));
        if (dbInst !== undefined) {
            lastBlock = dbInst.block;
            bsNew.next(dbInst);
        }

        // Set up a pipe from the block to fetch new versions if a new block
        // is available.
        this.newBlock
            .pipe(
                filter((v) => !v.equals(lastBlock)),
                mergeMap((v) => this.getInstanceFromChain(id)))
            .subscribe({next: (inst) => bsNew.next(inst)});
        this.cache.set(id, bsNew);
        return bsNew.pipe(
            distinctUntilChanged((a, b) => a.version.equals(b.version))
        );
    }

    public async reload(): Promise<void> {
        await this.getInstanceFromChain(ByzCoinSimul.configInstanceID);
    }

    private async getInstanceFromChain(id: InstanceID): Promise<IInstance> {
        Log.lvl3("get instance", id);
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
        await this.db.setObject(inst.key.toString("hex"), inst);
        if (!inst.block.equals(this.newBlock.getValue())) {
            Log.lvl3("got new block:", inst.block);
            await this.db.set(Instances.dbKeyBlockIndex,
                Buffer.from(inst.block.toBytes()));
            this.newBlock.next(inst.block);
        }
        return inst;
    }
}
