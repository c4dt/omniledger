/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData, fromObject } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { Page } from "tns-core-modules/ui/page";
import Log from "~/lib/cothority/log";
import { uData } from "~/lib/user-data";
import { PollView } from "~/pages/lab/poll/poll-view";

export let elPoll: PollView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    elPoll = new PollView();
    page.bindingContext = elPoll;
    setTimeout(() => updatePoll(), 1);
}

export async function updatePoll() {
    try {
        elPoll.setProgress("Reloading polls", 33);
        await uData.reloadPolls();
        elPoll.setProgress("Updating polls", 66);
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
