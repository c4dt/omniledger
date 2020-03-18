import {started, stopConodes} from "spec/support/conondes";

afterAll(async (done) => {
    // make sure we stop the container at the end
    if (started) {
        await stopConodes();
    }

    done();
});
