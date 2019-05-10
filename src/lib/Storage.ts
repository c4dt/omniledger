import Dexie from "dexie";

export class Storage {
    static db: Dexie = null;

    static async set(key: string, buffer: string) {
        return this.getDB().put({key, buffer});
    }

    static async get(key: string): Promise<string> {
        const entry = this.getDB().where("key").equals(key);
        if (await entry.count() === 1){
            return (await entry.first()).buffer;
        }
        return "";
    }

    static async putObject(key: string, obj: any) {
        await Storage.set(key, JSON.stringify(obj));
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

    private static getDB(): Dexie.Table<IContact, number> {
        if (!this.db) {
            this.db = new Dexie("dynasent");
            this.db.version(1).stores({
                contacts: "++id,key,buffer",
            });
        }
        return this.db.table("contacts");
    }
}

interface IContact {
    id?: number;
    key: string;
    buffer: string;
}

export class StorageLocalStorage {
    static pre = "dyna_";

    static set(key: string, value: string) {
        localStorage.setItem(this.pre + key, value);
    }

    static get(key: string): string {
        return localStorage.getItem(this.pre + key);
    }

    static putObject(key: string, obj: any) {
        Storage.set(key, JSON.stringify(obj));
    }

    static getObject(entry: string): any {
        const obj = JSON.parse(this.get(entry), (key, value) => {
            if (value && typeof value === "object" && value.type === "Buffer") {
                return Buffer.from(value);
            }
            return value;
        });
        return obj == null ? {} : obj;
    }
}
