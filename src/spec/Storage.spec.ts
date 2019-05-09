import { Storage } from "../lib/Storage";

describe("Storage", () => {
    it("should store and load elements", async () => {
        Storage.set("one", "1");
        expect(Storage.get("one")).toBe("1");
    });

    it("should marshal buffer", async () => {
        const a = {
            one: 1,
            two: Buffer.from("two"),
        };
        Storage.putObject("obj", a);
        expect(Storage.getObject("obj")).toEqual(a);
    });
});
