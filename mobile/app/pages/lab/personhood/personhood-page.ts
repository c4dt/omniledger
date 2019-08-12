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
import { msgFailed, msgOK } from "~/lib/messages";
import { uData } from "~/lib/user-data";
import { PersonhoodView } from "~/pages/lab/personhood/personhood-view";

export let elements: PersonhoodView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    elements = new PersonhoodView();
    page.bindingContext = elements;
    setTimeout(() => updateParties(), 1);
}

export async function updateParties() {
    try {
        elements.setProgress("Updating", 20);
        await elements.updateAddParty();
        await uData.reloadParties();
        await uData.save();
        elements.setProgress("Updating Parties", 50);
        await elements.updateParties();
        elements.setProgress("Updating Badges", 75);
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
