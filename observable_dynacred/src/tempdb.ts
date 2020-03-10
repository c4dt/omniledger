import Long from "long";

import {Log} from "@dedis/cothority";

import {IDataBase} from "./byzcoin/instances";

export class TempDB implements IDataBase {
    private kv: Map<string, Buffer>;

    constructor() {
        this.kv = new Map<string, Buffer>();
    }

    public async get(key: string): Promise<Buffer | undefined> {
        this.kv.forEach((v, k) => {
            Log.lvl4("db-dump:", k, v);
        });
        return this.kv.has(key) ? this.kv.get(key) : undefined;
    }

    public async getObject<T>(key: string): Promise<T | undefined> {
        const buf = await this.get(key);
        if (buf === undefined) {
            return undefined;
        }
        return JSON.parse(buf.toString(), (key, value) => {
            if (value && typeof value === "object") {
                if (value.type && value.type === "Buffer") {
                    return Buffer.from(value);
                } else if (value.low !== undefined && value.high !== undefined) {
                    return Long.fromValue(value);
                }
            }
            return value;
        });
    }

    public async set(key: string, value: Buffer): Promise<void> {
        this.kv.set(key, value);
    }

    public async setObject<T>(key: string, obj: T): Promise<void> {
        return this.set(key, Buffer.from(JSON.stringify(obj)));
    }
}
