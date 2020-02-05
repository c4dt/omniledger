import {History} from "./support/history";

describe("helper should", () => {
    it("should wait", async () => {
        const h = new History();
        await h.resolve([]);
        h.push("one");
        await h.resolve(["one"]);
        h.push("two", "three");
        await h.reject(["two"], true);
        await h.resolve(["three"]);
        setTimeout(() => {
            h.push("four")
        }, 100);
        await h.resolve(["four"]);
    })
})
