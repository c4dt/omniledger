export class Storage {
    static pre = "dyna_";

    static set(key: string, value: string) {
        localStorage.setItem(Storage.pre + key, value);
    }

    static get(key: string): string {
        return localStorage.getItem(Storage.pre + key);
    }

    static putObject(key: string, obj: any) {
        Storage.set(key, JSON.stringify(obj));
    }

    static getObject(key: string): any {
        const obj = JSON.parse(Storage.get(key), (key, value) => {
            if (value && typeof value === "object" && value.type == "Buffer") {
                return Buffer.from(value);
            }
            return value;
        });
        return obj == null ? {} : obj;
    }
}
