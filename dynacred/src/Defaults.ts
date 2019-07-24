// import { FileIO } from "./FileIO";
import "cross-fetch/polyfill";

// tslint:disable-next-line
export const Defaults = {
    // Testing
    Testing: false,
};

export function activateTesting() {
    Defaults.Testing = true;
}
