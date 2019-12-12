// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { Page } from "tns-core-modules/ui/page";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed, msgOK } from "~/lib/messages";
import { PersonhoodView } from "~/pages/lab/personhood/personhood-view";

export let elements: PersonhoodView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    elements = new PersonhoodView();
    page.bindingContext = elements;
    await updateParties();
}

export async function updateParties() {
    try {
        elements.setProgress(localize("progress.updating"), 20);
        await elements.updateAddParty();
        await uData.reloadParties();
        elements.setProgress(localize("personhood.updating_parties"), 50);
        await elements.updateParties();
        elements.setProgress(localize("personhood.updating_badges"), 75);
        await elements.updateBadges();
        elements.setProgress();
    } catch (e) {
        elements.setProgress(e, -100);
        await msgFailed("Error loading parties: " + e);
        elements.setProgress();
        Log.catch(e);
    }
}

export async function addParty(args: GestureEventData) {
    return topmost().navigate({
        moduleName: "pages/lab/personhood/add-party/add-party-page",
    });
}
