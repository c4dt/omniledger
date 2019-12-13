// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { Page } from "tns-core-modules/ui/page";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed, msgOKCancel } from "~/lib/messages";
import { RopasciView } from "~/pages/lab/ropasci/ropasci-view";

export let elRoPaSci: RopasciView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    elRoPaSci = new RopasciView();
    page.bindingContext = elRoPaSci;
    if (!uData.contact.isRegistered()) {
        await msgFailed(localize("ropascis.need_registration"));
        return topmost().navigate({
            moduleName: "pages/home/home-page",
        });
    } else {
        setTimeout(() => updateRoPaSci(), 1000);
    }
}

export async function updateRoPaSci() {
    try {
        setProgress(localize("ropascis.reloading"), 33);
        await uData.reloadRoPaScis();
        setProgress(localize("ropascis.updating"), 66);
        await uData.updateRoPaScis();
        setProgress(localize("ropascis.updating"), 90);
        await uData.save();
        await elRoPaSci.updateRoPaScis();
    } catch (e) {
        Log.catch(e);
    }
    setProgress();
}

export async function addRoPaSci(args: GestureEventData) {
    return topmost().navigate({
        moduleName: "pages/lab/ropasci/add/add-page",
    });
}

export async function wipeRoPaSci() {
    if (await msgOKCancel("Wipe all games?", "Wipe", "Don't")) {
        await uData.phrpc.wipeRPS();
        return updateRoPaSci();
    }
}

export function setProgress(text: string = "", width: number = 0) {
    elRoPaSci.set("networkStatus", width === 0 ? undefined : text);
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        topmost().getViewById("progress_bar")
            .setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}
