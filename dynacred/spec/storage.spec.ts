import { StorageLocalStorage } from "../src/Storage";

describe("StorageLocalStorage", () => {
    it("should store and load elements", async () => {
        StorageLocalStorage.set("one", "1");
        expect(await StorageLocalStorage.get("one")).toBe("1");
    });

    it("should marshal buffer", async () => {
        const a = {
            one: 1,
            two: Buffer.from("two"),
        };
        await StorageLocalStorage.putObject("obj", a);
        expect(await StorageLocalStorage.getObject("obj")).toEqual(a);
    });
});
