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
        // (await this.getDB().toArray()).forEach((ic) => Log.print(ic.key));
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

interface IContact {
    key: string;
    buffer: string;
}
