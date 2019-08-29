import { StorageLocalStorage } from "../../src/Storage";
import { TestData } from "../../src/test-data";
import { ROSTER, startConodes } from "./conondes";

export class TData {
    static async init(): Promise<TestData> {
        await startConodes();
        const roster = ROSTER.slice(0, 4);
        return TestData.init("admin", roster, StorageLocalStorage);
    }
}
