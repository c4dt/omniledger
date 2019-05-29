import { StorageDB } from "../lib/StorageDB";

describe("StorageDB", () => {
    it("should store and load elements", async () => {
        StorageDB.set("one", "1");
        expect(await StorageDB.get("one")).toBe("1");
    });

    it("should marshal buffer", async () => {
        const a = {
            one: 1,
            two: Buffer.from("two"),
        };
        await StorageDB.putObject("obj", a);
        expect(await StorageDB.getObject("obj")).toEqual(a);
    });
});
