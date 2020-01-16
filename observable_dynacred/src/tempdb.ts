import {InstanceID, Proof} from "@dedis/cothority/byzcoin";

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
        return this.kv.get(key);
    }

    public async set(key: string, value: Buffer): Promise<void> {
        this.kv.set(key, value);
    }
}
