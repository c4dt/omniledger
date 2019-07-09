import { hexBuffer } from "./Ui";

describe("Ui elements should", async () => {
    it("split buffer", () => {
        expect(hexBuffer(Buffer.from("0123456789ab", "hex"), 4)).toBe("0123 4567 89ab");
    });
});
