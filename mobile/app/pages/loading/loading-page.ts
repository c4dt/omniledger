/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/
// tslint:disable-next-line
require("nativescript-nodeify");

import * as application from "tns-core-modules/application";
import { EventData } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { appRootMain, appRootSetup } from "~/app-root";
import Log from "~/lib/cothority/log";
import { WebSocketAdapter } from "~/lib/cothority/network";
import { setFactory } from "~/lib/cothority/network/connection";
import { msgFailed, msgOK } from "~/lib/messages";
import { NativescriptWebSocketAdapter } from "~/lib/nativescript-ws";
import { initBC, loadData, newByzCoin, testingMode, uData } from "~/lib/user-data";

declare const exit: (code: number) => void;

// Verify if we already have data or not. If it's a new installation, present the project
// and ask for an alias, and set up keys. In testing mode, allow for creating a new
// ByzCoin.
export async function navigatingTo(args: EventData) {
    Log.lvl2("navigatingTo: loading-page");
    setFactory((path: string): WebSocketAdapter => new NativescriptWebSocketAdapter(path));

    Log.lvl1("Connecting to ByzCoin");
    try {
        await initBC();
    } catch (e) {
        Log.catch(e);
        if (testingMode) {
            // tslint:disable:object-literal-sort-keys
            if (await dialogs.confirm({
                title: "ByzCoin error",
                message: "Couldn't contact ByzCoin, you should perhaps create a new one",
                okButtonText: "Init ByzCoin",
                cancelButtonText: "Quit",
                // tslint:enable:object-literal-sort-keys
            })) {
                try {
                    await newByzCoin();
                } catch (e) {
                    await msgFailed(e.toString(), "Failed to setup ByzCoin");
                    quit();
                }
                await msgOK(
                    "A new byzcoin has been created - please update your user-data.ts",
                    "ByzCoin created",
                );
                return appRootMain();
            }
            return quit();
        } else {
            return again(args);
        }
    }

    Log.lvl1("Loading data");
    try {
        await loadData();
    } catch (e) {
        Log.catch(e);
        if (testingMode) {
            // This is a little bit dangerous, as a testing-setup could be destroyed if not handled
            // carefully. But as it's just a testing, this should be OK...
            return appRootSetup();
        } else {
            return again(args);
        }
    }

    if (!uData.contact.alias || uData.contact.alias === "new identity") {
        Log.lvl1("Looks like an empty data - going for setup");
        return appRootSetup();
    } else {
        Log.lvl1("Going for main");
        return appRootMain();
    }
}

function quit() {
    if (application.android) {
        application.android.foregroundActivity.finish();
    } else {
        exit(0);
    }
}

async function again(args: EventData) {
    // tslint:disable:object-literal-sort-keys
    if (await dialogs.confirm({
        title: "Network error",
        message: "Make sure you have a network connection. Do you want to try again?",
        okButtonText: "Try again",
        cancelButtonText: "Quit",
        // tslint:enable:object-literal-sort-keys
    })) {
        return navigatingTo(args);
    } else {
        quit();
    }
}
