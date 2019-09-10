import { EventData, fromObjectRecursive, Observable } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/frame";
import { openUrl } from "tns-core-modules/utils/utils";
import { appRootMain, appRootNav } from "~/app-root";
import Log from "~/lib/cothority/log";
import { Data } from "~/lib/dynacred";
import { msgFailed, msgOK } from "~/lib/messages";
import { scan } from "~/lib/scan";
import { StorageFile } from "~/lib/storage-file";
import { attachDevice, bc, newByzCoin, testingMode, uData } from "~/lib/user-data";

const view: Observable = fromObjectRecursive({
    hasBC: !!bc,
    networkStatus: undefined,
    testing: testingMode,
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
        setProgress("creating ByzCoin", 30);
        await newByzCoin();

        setProgress("verify registration", 70);
        await uData.contact.updateOrConnect(uData.bc);

        setProgress("saving", 100);
        await uData.save();
        await msgOK("You should update user-data.ts now");
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
        setProgress("Attaching device", 33);
        await attachDevice(url.text);
        setProgress("Saving data", 66);
        uData.storage = StorageFile;
        await uData.save();
        setProgress("Done", 100);
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
    openUrl("https://personhood.online");
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
