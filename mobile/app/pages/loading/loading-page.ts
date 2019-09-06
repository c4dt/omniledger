/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/
// tslint:disable-next-line
require("nativescript-nodeify");

import * as application from "tns-core-modules/application";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/page";
import { appRootMain, appRootSetup } from "~/app-root";
import Log from "~/lib/cothority/log";
import { WebSocketAdapter } from "~/lib/cothority/network";
import { setFactory } from "~/lib/cothority/network/connection";
import { Data } from "~/lib/dynacred";
import { msgFailed, msgOK } from "~/lib/messages";
import { NativescriptWebSocketAdapter } from "~/lib/nativescript-ws";
import { StorageFile } from "~/lib/storage-file";
import { appVersion, initBC, loadData, newByzCoin, testingMode, uData } from "~/lib/user-data";

declare const exit: (code: number) => void;

// Verify if we already have data or not. If it's a new installation, present the project
// and ask for an alias, and set up keys. In testing mode, allow for creating a new
// ByzCoin.
export async function navigatingTo(args: EventData) {
    Log.lvl2("navigatingTo: loading-page");
    setFactory((path: string): WebSocketAdapter => new NativescriptWebSocketAdapter(path));
    const steps = new ObservableArray();
    const page = args.object as Page;
    page.bindingContext = {steps};

    Log.lvl1("Connecting to ByzCoin");
    try {
        steps.push({text: "Got version: " + appVersion});
        steps.push({text: "Testing network"});

        steps.push({text: "Connecting to ByzCoin"});
        await initBC();
        steps.push({text: "Connected"});
    } catch (e) {
        if (testingMode) {
            const actions = ["Setup", "Init Byzcoin"];
            // tslint:disable:object-literal-sort-keys
            switch (await dialogs.action({
                title: "ByzCoin error",
                message: "Couldn't contact ByzCoin, you should perhaps create a new one",
                cancelButtonText: "Quit",
                actions,
                // tslint:enable:object-literal-sort-keys
            })) {
                case actions[0]:
                    return appRootSetup();
                case actions[1]:
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
        steps.push({text: "Loading Data"});
        await loadData();
        steps.push({text: "Data loaded"});

        if (!uData.contact.alias || uData.contact.alias === "new identity") {
            Log.lvl1("Looks like an empty data - going for setup");
            return appRootSetup();
        } else {
            Log.lvl1("Going for main");
            return appRootMain();
        }
    } catch (e) {
        if (testingMode) {
            // This is a little bit dangerous, as a testing-setup could be destroyed if not handled
            // carefully. But as it's just a testing, this should be OK...
            return appRootSetup();
        }
    }

    try {
        // This is to be _really_ sure we don't overwrite the user's data. We could reason that it's
        // nearly impossible to be able to connect, but not to load the user's data from BC. But, only
        // nearly impossible...
        if ((await StorageFile.get(Data.defaultStorage)) != null) {
            return again(args);
        }
    } catch (e) {
        Log.warn("Couldn't read data");
    }
    return appRootSetup();
}

function quit() {
    if (application.android) {
        application.android.foregroundActivity.finish();
    } else {
        exit(0);
    }
}

async function again(args: EventData) {
    const actions = ["Again", "Delete"];
    // tslint:disable:object-literal-sort-keys
    switch (await dialogs.action({
        title: "Network error",
        message: "Make sure you have a network connection. Do you want to try again?",
        cancelButtonText: "Quit",
        actions,
        // tslint:enable:object-literal-sort-keys
    })) {
        case actions[0]:
            return navigatingTo(args);
        case actions[1]:
            return appRootSetup();
        default:
            quit();
    }
}
