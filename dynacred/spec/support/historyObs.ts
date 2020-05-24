import { Log } from "@dedis/cothority";

export class HistoryObs {

    private readonly entries: string[] = [];

    push(...e: string[]) {
        this.entries.push(...e);
    }

    async resolve(newEntries: string[], complete?: boolean): Promise<void> {
        await expectAsync(this.expect(newEntries, true, complete)).toBeResolved();
    }

    async resolveAll(newEntries: string[]): Promise<void> {
        let found = true;
        while (found) {
            try {
                await this.expect(newEntries, true, false, true);
            } catch (e) {
                Log.lvl4(e);
                found = false;
            }
        }
    }

    async reject(newEntries: string[], complete?: boolean): Promise<void> {
        await expectAsync(this.expect(newEntries, false, complete)).toBeRejected();
    }

    async expect(newEntries: string[], succeed: boolean, complete?: boolean, silent?: boolean): Promise<void> {
        return new Promise(async (res, rej) => {
            try {
                for (let i = 0; i < 5 && this.entries.length < newEntries.length; i++) {
                    if (!silent) {
                        Log.lvl3("waiting", i, this.entries.length, newEntries.length);
                    }
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
                if (!silent) {
                    if (succeed) {
                        Log.lvl2("History:", this.entries, "wanted:", newEntries);
                    } else {
                        Log.lvl2("Want history:", this.entries, "to fail with:", newEntries);
                    }
                }
                if (this.entries.length < newEntries.length) {
                    throw new Error("not enough entries");
                }
                for (const e of newEntries) {
                    const h = this.entries.splice(0, 1)[0];
                    if (e !== h) {
                        throw new Error(`Got ${h} instead of ${e}`);
                    }
                }
                if (complete && this.entries.length !== 0) {
                    throw new Error(`didn't describe all history: ${this.entries}`);
                }
                res();
            } catch (e) {
                if (succeed) {
                    if (!silent) {
                        Log.error(e);
                    }
                }
                rej(e);
            }
        });
    }
}
