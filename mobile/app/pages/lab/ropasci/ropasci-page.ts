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
import { RopasciView } from "~/pages/lab/ropasci/ropasci-view";

export let elRoPaSci: RopasciView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    elRoPaSci = new RopasciView();
    page.bindingContext = elRoPaSci;
    await elRoPaSci.updateRoPaScis();
    setTimeout(() => updateRoPaSci(), 1);
}

export async function updateRoPaSci() {
    try {
        RopasciView.setProgress("Reloading games", 33);
        await uData.reloadRoPaScis();
        RopasciView.setProgress("Updating games", 66);
        await uData.updateRoPaScis();
        await uData.save();
        await elRoPaSci.updateRoPaScis();
    } catch (e) {
        Log.catch(e);
    }
    RopasciView.setProgress();
}

export async function addRoPaSci(args: GestureEventData) {
    return topmost().navigate({
        moduleName: "pages/lab/ropasci/add/add-page",
    });
}
