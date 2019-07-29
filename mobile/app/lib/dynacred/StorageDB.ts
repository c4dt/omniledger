import Dexie from "dexie";
import FileIO from "../FileIO";
import Log from "~/lib/cothority/log"

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
        return strToObject(await this.get(entry));
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

export class StorageLocal {
    static pre = "dyna_";

    static set(key: string, value: string) {
        localStorage.setItem(this.pre + key, value);
    }

    static get(key: string): string {
        return localStorage.getItem(this.pre + key);
    }

    static putObject(key: string, obj: any) {
        StorageLocal.set(key, JSON.stringify(obj));
    }

    static getObject(entry: string): any {
        return strToObject(this.get(entry));
    }
}

export class StorageFile {
    static fileName = "dyna.json";
    static keyValues: any = {};

    static async set(key: string, value: string) {
        this.keyValues[key] = value;
        await FileIO.writeFile(this.fileName, JSON.stringify(this.keyValues));
    }

    static async get(key: string): Promise<string> {
        if (Object.keys(this.keyValues).length === 0) {
            try {
                this.keyValues = strToObject(await FileIO.readFile(this.fileName));
            } catch(e){
                Log.warn("probably empty storage...", e);
                this.keyValues = {};
            }
        }
        return this.keyValues[key];
    }

    static async putObject(key: string, obj: any) {
        await StorageFile.set(key, JSON.stringify(obj));
    }

    static async getObject(entry: string): Promise<any> {
        return strToObject(await this.get(entry));
    }
}

function strToObject(str: string): any {
    const obj = JSON.parse(str, (key, value) => {
        if (value && typeof value === "object" && value.type === "Buffer") {
            return Buffer.from(value);
        }
        return value;
    });
    return obj == null ? {} : obj;
}
