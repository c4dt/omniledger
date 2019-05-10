import { Storage } from "../lib/Storage";

describe("Storage", () => {
    it("should store and load elements", async () => {
        Storage.set("one", "1");
        expect(await Storage.get("one")).toBe("1");
    });

    it("should marshal buffer", async () => {
        const a = {
            one: 1,
            two: Buffer.from("two"),
        };
        await Storage.putObject("obj", a);
        expect(await Storage.getObject("obj")).toEqual(a);
    });
});
