// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import { fromObject } from "tns-core-modules/data/observable";
import { EventData, Page, topmost } from "tns-core-modules/ui/frame";
import { uData } from "~/lib/byzcoin-def";
import { getMax, getRawData } from "~/lib/personhood";

let page: Page;
const rundown = fromObject({});

export async function navigatingTo(args: EventData) {
    Log.lvl2("navigatingTo: home");
    page = args.object as Page;
    const max = getMax();
    try {
        const count = getRawData(uData);
        addRundown(count.attributes, max.attributes, "attributes");
        addRundown(count.registered, max.registered, "registrations");
        // addRundown(count.meetups, max.meetups, "meetups");
        addRundown(count.parties, max.parties, "parties");
        addRundown(count.roPaScis, max.roPaScis, "ropascis");
        addRundown(count.polls, max.polls, "polls");
        addRundown(count.snack, max.snack, "snack");
        addRundown(count.invites, max.invites, "invites");
        page.bindingContext = rundown;
    } catch (e) {
        Log.catch(e);
    }
}

function addRundown(now: number, max: number, attribute: string) {
    const label = attribute + "_rundown";
    let text = localize("score.done", max.toString(), localize("score." + attribute),
        localize("score." + attribute + "_done"));
    if (now < max) {
        text = localize("score.improve", now.toString(), max.toString(), localize("score." + attribute),
            localize("score." + attribute + "_improve"));
        rundown.set(label + "_label", "\uf05a  ");
    } else {
        rundown.set(label + "_label", "\uf058  ");
    }
    rundown.set(label, text);
}

export async function goBack() {
    return topmost().goBack();
}
