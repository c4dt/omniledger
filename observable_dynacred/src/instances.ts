import {Log} from "@dedis/cothority";
import {InstanceID} from "@dedis/cothority/byzcoin";
import {StateChangeBody} from "@dedis/cothority/byzcoin/proof";
import {SkipBlock} from "@dedis/cothority/skipchain";
import Long = require("long");
import {BehaviorSubject} from "rxjs";
import {IDataBase} from "./tempdb";

export interface IInstance {
    key: InstanceID;
    value: Buffer;
    block: Long;
    contractID: string;
    version: Long;
    darcID: InstanceID;
}

export function newIInstance(key: InstanceID, value: Buffer): IInstance {
    return {
        block: Long.fromNumber(-1),
        contractID: "",
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

export interface IByzCoinProof {
    getProof(inst: InstanceID): Promise<IProof>;
}

export class Instances {

    public static fromScratch(db: IDataBase, bc: IByzCoinProof): Instances {
        return new Instances(db, bc);
    }

    private cache = new Map<InstanceID, BehaviorSubject<IInstance>>();
    private newBlock: BehaviorSubject<Long> = new BehaviorSubject(Long.fromNumber(-1));

    constructor(private db: IDataBase, private bc: IByzCoinProof) {
    }

    public async init(): Promise<void> {
        const p = await this.bc.getProof(Buffer.alloc(32));
        this.newBlock.next(Long.fromNumber(p.skipblock.index));
    }

    public async getInstance(id: InstanceID): Promise<BehaviorSubject<IInstance>> {
        const o = this.cache.get(id);
        if (o !== undefined) {
            return o;
        }
        const ii = await this.gi(id);
        const bs = new BehaviorSubject(ii);
        this.newBlock.subscribe({next: async (v) => {
                const gi = await this.gi(id);
                if (!gi.version.equals(bs.getValue().version)) {
                    bs.next(gi);
                }
            }});
        this.cache.set(id, bs);
        return this.getInstance(id);
    }

    public async reload(): Promise<void> {
        await this.gi(Buffer.alloc(32));
    }

    private async gi(id: InstanceID): Promise<IInstance> {
        // const known = this.db.get(id.toString("hex"));
        // if (known !== undefined) {
        //     Log.print("known id", id);
        //     return newIInstance(Buffer.alloc(32), Buffer.from("0"));
        // }
        const p = await this.bc.getProof(id);
        if (!p.exists(id)) {
            throw new Error("didn't found instance in cache or on chain");
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
            Log.print("got new block", inst.block, this.newBlock.getValue());
            this.newBlock.next(inst.block);
        }
        return inst;
    }
}
