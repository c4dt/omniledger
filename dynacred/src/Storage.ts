import Log from "@c4dt/cothority/log";
import { Buffer } from "buffer";
import Dexie from "dexie";

export interface IStorage {
    set(key: string, buffer: string);

    get(key: string): Promise<string>;

    putObject(key: string, obj: any);

    getObject(entry: string): Promise<any>;
}

export class StorageDB {
    static db: Dexie = null;

    static async set(key: string, buffer: string) {
        return this.getDB().put({key, buffer});
    }

    static async get(key: string): Promise<string> {
        const entry = await this.getDB().get(key);
        if (entry) {
            return entry.buffer;
        }
        return "";
    }

    static async putObject(key: string, obj: any) {
        await StorageDB.set(key, JSON.stringify(obj));
    }

    static async getObject(entry: string): Promise<any> {
        const obj = JSON.parse(await this.get(entry), (key, value) => {
            if (value && typeof value === "object" && value.type === "Buffer") {
                return Buffer.from(value);
            }
            return value;
        });
        return obj == null ? {} : obj;
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

    static async get(key: string): Promise<string> {
        return StorageLocalStorage.localStorage[this.pre + key];
    }

    static async putObject(key: string, obj: any) {
        return StorageLocalStorage.set(key, JSON.stringify(obj));
    }

    static async getObject(entry: string): Promise<any> {
        const obj = JSON.parse(await StorageLocalStorage.get(entry), (key, value) => {
            if (value && typeof value === "object" && value.type === "Buffer") {
                return Buffer.from(value);
            }
            return value;
        });
        return obj == null ? {} : obj;
    }
}

interface IContact {
    key: string;
    buffer: string;
}
