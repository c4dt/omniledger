import * as http from "http";
import { Data } from "../src/Data";
import { activateTesting } from "../src/Defaults";

function getLocalServer(): Promise<http.Server> {
    const srv = http.createServer((req, res) => {
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.end("TODO");
    });

    // TODO hardcoded addr, better providing it to tests
    return new Promise((resolve, reject) =>
        srv.listen(4200, "localhost", () =>
            resolve(srv),
        ),
    );
}

describe("Data", async () => {
    let srv: http.Server;

    beforeEach(async () => {
        srv = await getLocalServer();
        activateTesting();
    });

    afterEach(async () => {
        if (typeof srv !== "undefined") {
            await new Promise((resolve, reject) => srv.close(resolve));
        }
    });

    it("can be trivially constructed", async () => new Data());
});
