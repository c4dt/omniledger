// tslint:disable-next-line
require("nativescript-nodeify");

import { Data } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import { EventData, fromObjectRecursive, Observable } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/frame";
import { openUrl } from "tns-core-modules/utils/utils";
import { appRootMain, appRootNav } from "~/app-root";
import { attachDevice, bc, bcDef, newByzCoin, uData } from "~/lib/byzcoin-def";
import { msgFailed, msgOK } from "~/lib/messages";
import { scan } from "~/lib/scan";
import { StorageFile } from "~/lib/storage-file";

const view: Observable = fromObjectRecursive({
    hasBC: !!bc,
    networkStatus: undefined,
    testing: bcDef.testingMode,
});
let page: Page;

export async function navigatingTo(args: EventData) {
    Log.lvl2("navigatingTo: 1-present");
    page = args.object as Page;
    page.bindingContext = view;
    Log.lvl1("Initializing new Data");
    setProgress();
}

export async function goInitTest(args: EventData) {
    try {
        setProgress(localize("presenting.creating_byzcoin"), 30);
        await newByzCoin();

        setProgress(localize("presenting.verifying_registration"), 70);
        await uData.contact.updateOrConnect(uData.bc);

        setProgress(localize("progress.saving"), 100);
        await uData.save();
        await msgOK("You should update app/lib/byzcoin-defs.ts now with the lines given in the console output.");
        appRootMain();
    } catch (e) {
        await Log.rcatch(e);
    }
}

export async function scanDevice() {
    const url = await scan("Scan device QRcode");
    if (!url.text.includes(Data.urlNewDevice)) {
        await msgFailed("Got wrong URL: " + url.text);
    }
    try {
        setProgress(localize("presenting.attaching_device"), 33);
        await attachDevice(url.text);
        setProgress(localize("progress.saving"), 66);
        uData.storage = StorageFile;
        await uData.save();
        setProgress(localize("progress.done"), 100);
    } catch (e) {
        Log.catch(e);
        setProgress();
        return msgFailed("Got error: " + e.toString(), "Failed to attach to device");
    }
    setProgress();
    return appRootMain();
}

export function goAlias(args: EventData) {
    appRootNav("pages/setup/2-alias");
}

export function goPersonhood() {
    openUrl("https://oh19.c4dt.org");
}

export async function goRecover(args: EventData) {
    // tslint:disable:object-literal-sort-keys
    const doit = await dialogs.confirm({
        title: "Start Recovery",
        message: "Did you lose your identity and have set up contacts to recover it?",
        okButtonText: "Recover",
        cancelButtonText: "Cancel",
        // tslint:enable:object-literal-sort-keys
    });
    if (doit) {
        try {
            appRootNav("pages/setup/4-recover");
        } catch (e) {
            Log.catch(e);
        }
    }
}

export function setProgress(text: string = "", width: number = 0) {
    Log.lvl2("setProgress:", width, text);
    view.set("networkStatus", width === 0 ? undefined : text);
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}
