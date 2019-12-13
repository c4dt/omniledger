// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { Frame, getFrameById } from "tns-core-modules/ui/frame";

// Sets the root frame to the main-app that contains the tabs for normal operation.
export function appRootMain() {
    Log.lvl1("appRootMain");
    appRootNav("main-page");
}

// Sets the root frame to the first page of the setup procedure to either sign up a user, or, in test mode, to
// allow for creating a new ByzCoin.
export function appRootSetup() {
    Log.lvl1("appRootSetup");
    appRootNav("pages/setup/1-present");
}

// Set the root frame to any path - mostly used in the setup system
export function appRootNav(page: string) {
    const f = getFrameById("app-root") as Frame;
    f.navigate(page);
}
