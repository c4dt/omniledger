// import { FileIO } from "./FileIO";
import "cross-fetch/polyfill";

// tslint:disable-next-line
export const Defaults = {
    // IDs
    // TODO remove these when data path is clearer
    ByzCoinID: Buffer.alloc(0), // genesis block -> config.toml

    // Testing
    Testing: false,
};

export function activateTesting() {
    Defaults.Testing = true;
    Defaults.ByzCoinID = Buffer.from("5f78d08a260b6fcc0b492448ec272dc4a59794ddf34a9914fdfe4f3faeba616e", "hex");
}

export function activateDEDIS() {
    Defaults.ByzCoinID = Buffer.from("9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3", "hex");
}

export function activateC4DT() {
    Defaults.ByzCoinID = Buffer.from("5b081e02e38e583085204abfe4553ceb6e0833a530bf8fa476ce2f5c1a9a51ae", "hex");
}

// TODO ugly hack to delay fetching when running tests, would be fixed with
// having a not globally defined and not auto-initialized Defaults
if (typeof window !== "undefined") {
    // activateC4DT();
    activateDEDIS();
    // activateTesting();
}
