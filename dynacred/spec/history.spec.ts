import { HistoryObs } from "spec/support/historyObs";

describe("history should", () => {
    it("should wait", async () => {
        const h = new HistoryObs();
        await h.resolve([]);
        h.push("one");
        await h.resolve(["one"]);
        h.push("two", "three");
        await h.reject(["two"], true);
        await h.resolve(["three"]);
        setTimeout(() => {
            h.push("four");
        }, 100);
        await h.resolve(["four"]);
    });
});
