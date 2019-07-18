/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData, fromObject} from "tns-core-modules/data/observable";
import {gData} from "~/lib/Data";
import {Page} from "tns-core-modules/ui/page";
import {Log} from "~/lib/Log";
import {GestureEventData} from "tns-core-modules/ui/gestures";
import {topmost} from "tns-core-modules/ui/frame";
import {RopasciView} from "~/pages/lab/ropasci/ropasci-view";

export let elRoPaSci: RopasciView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = <Page>args.object;
    elRoPaSci = new RopasciView();
    page.bindingContext = elRoPaSci;
    await elRoPaSci.updateRoPaScis();
    setTimeout(()=>updateRoPaSci(), 1);
}

export async function updateRoPaSci() {
    try {
        elRoPaSci.setProgress("Reloading games", 33);
        await gData.reloadRoPaScis();
        elRoPaSci.setProgress("Updating games", 66);
        await gData.updateRoPaScis();
        await gData.save();
        await elRoPaSci.updateRoPaScis();
    } catch(e){
        Log.catch(e);
    }
    elRoPaSci.setProgress();
}

export async function addRoPaSci(args: GestureEventData) {
    return topmost().navigate({
        moduleName: "pages/lab/ropasci/add/add-page",
    });
}
