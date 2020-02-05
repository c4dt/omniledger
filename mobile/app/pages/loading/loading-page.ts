// tslint:disable-next-line
require("nativescript-nodeify");

import { Data } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { WebSocketAdapter } from "@dedis/cothority/network";
import { setFactory } from "@dedis/cothority/network/connection";
import * as application from "tns-core-modules/application";
import { EventData } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/page";
import { appRootMain, appRootSetup } from "~/app-root";
import { appVersion, bcDef, initBC, loadData, speedTest } from "~/lib/byzcoin-def";
import { msgOK } from "~/lib/messages";
import { NativescriptWebSocketAdapter } from "~/lib/nativescript-ws";
import { StorageFile } from "~/lib/storage-file";

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
        steps.push({text: "Measuring network"});
        await speedTest(3, (i, fastest) => {
            const str = `ping #${i}: ${fastest}`;
            Log.lvl2("Pinging:", str);
            steps.push({text: str});
        });
        steps.push({text: "Fetching latest block from ByzCoin"});
        await initBC();
        steps.push({text: "Connected"});
    } catch (e) {
        Log.catch(e);
        if (bcDef.testingMode) {
            await StorageFile.set("latest", "");
            return appRootSetup();
        } else {
            return again(args, e.toString());
        }
    }

    const storage = await StorageFile.get(Data.defaultStorage);
    if (!storage || storage === "") {
        Log.lvl1("Didn't find any storage");
        return appRootSetup();
    }

    Log.lvl1("Loading data");
    try {
        steps.push({text: "Loading Data"});
        await loadData();
        steps.push({text: "Data loaded"});
        Log.lvl1("Going for main");
        return appRootMain();
    } catch (e) {
        Log.catch(e);
        if (bcDef.testingMode) {
            return appRootSetup();
        } else {
            // This is to be _really_ sure we don't overwrite the user's data. We could reason that it's
            // nearly impossible to be able to connect, but not to load the user's data from BC. But, only
            // nearly impossible... see also https://xkcd.com/2200/
            return again(args, e.toString());
        }
    }
}

function quit() {
    if (application.android) {
        application.android.foregroundActivity.finish();
    } else {
        exit(0);
    }
}

async function again(args: EventData, err: string) {
    const actions = ["Again", "Delete"];
    // tslint:disable:object-literal-sort-keys
    switch (await dialogs.action({
        title: "Network error",
        message: "Error: " + err + "\n\nMake sure you have a network connection. Do you want to try again?",
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
