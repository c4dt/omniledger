// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import { EventData } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { Page } from "tns-core-modules/ui/page";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed } from "~/lib/messages";
import { PollView } from "~/pages/lab/poll/poll-view";

export let elPoll: PollView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    elPoll = new PollView();
    page.bindingContext = elPoll;
    if (uData.badges.length === 0) {
        await msgFailed(localize("polls.missing_badge"));
        return topmost().navigate({
            moduleName: "pages/home/home-page",
        });
    } else {
        setTimeout(() => updatePoll(), 1);
    }
}

export async function updatePoll() {
    try {
        elPoll.setProgress(localize("polls.reloading"), 33);
        await uData.reloadPolls();
        elPoll.setProgress(localize("polls.updating"), 66);
        await elPoll.updatePolls();
    } catch (e) {
        Log.catch(e);
    }
    elPoll.setProgress();
}

export async function addPoll(args: GestureEventData) {
    return topmost().navigate({
        moduleName: "pages/lab/poll/add/add-page",
    });
}
