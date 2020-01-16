import {Log} from "@dedis/cothority";

export interface IDataBase {
    get(key: string): Promise<Buffer|undefined>;
    set(key: string, value: Buffer): Promise<void>;
}

export class TempDB implements IDataBase {
    private kv: Map<string, Buffer>;

    constructor() {
        this.kv = new Map<string, Buffer>();
    }

    public async get(key: string): Promise<Buffer|undefined> {
        this.kv.forEach((v, k) => {
            Log.print("db:", k, v);
        });
        return this.kv.has(key) ? this.kv.get(key) : undefined;
    }

    public async set(key: string, value: Buffer): Promise<void> {
        this.kv.set(key, value);
    }
}
