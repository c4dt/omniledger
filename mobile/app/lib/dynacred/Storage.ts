import Log from "@dedis/cothority/log";
import { Buffer } from "buffer";
import Dexie from "dexie";

export interface IStorage {
    set(key: string, buffer: string);

    get(key: string): Promise<string | undefined>;

    putObject(key: string, obj: any);

    getObject(entry: string): Promise<any | undefined>;
}

export class StorageDB {
    static db: Dexie = undefined;

    static async set(key: string, buffer: string) {
        return this.getDB().put({key, buffer});
    }

    static async get(key: string): Promise<string | undefined> {
        const entry = await this.getDB().get(key);
        if (entry !== undefined) {
            return entry.buffer;
        }
        return undefined;
    }

    static async putObject(key: string, obj: any) {
        await StorageDB.set(key, JSON.stringify(obj));
    }

    static async getObject(entry: string): Promise<any | undefined> {
        const d = await this.get(entry);
        if (d === undefined) {
            return undefined;
        }
        try {
            return JSON.parse(d, (key, value) => {
                if (value && typeof value === "object" && value.type === "Buffer") {
                    return Buffer.from(value);
                }
                return value;
            });
        } catch (e) {
            if (e instanceof SyntaxError) {
                Log.catch(e, "couldn't parse data", d);
                return undefined;
            }
            throw e;
        }
    }

    private static getDB(): Dexie.Table<IContact, string> {
        if (!this.db) {
            this.db = new Dexie("dynasent");
            this.db.version(1).stores({
                contacts: "&key,buffer",
            });
        }
        return this.db.table("contacts");
    }
}

export class StorageLocalStorage {
    static pre = "dyna_";
    static localStorage: {[s: string]: string; } = {};

    static async set(key: string, value: string) {
        return StorageLocalStorage.localStorage[this.pre + key] = value;
    }

    static async get(key: string): Promise<string | undefined> {
        return StorageLocalStorage.localStorage[this.pre + key];
    }

    static async putObject(key: string, obj: any) {
        return StorageLocalStorage.set(key, JSON.stringify(obj));
    }

    static async getObject(entry: string): Promise<any | undefined> {
        const d = await StorageLocalStorage.get(entry);
        if (d === undefined) {
            return undefined;
        }
        return JSON.parse(d, (key, value) => {
            if (value && typeof value === "object" && value.type === "Buffer") {
                return Buffer.from(value);
            }
            return value;
        });
    }
}

interface IContact {
    key: string;
    buffer: string;
}
