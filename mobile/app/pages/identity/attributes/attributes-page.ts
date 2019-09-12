/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { localize } from "nativescript-localize";
import { EventData } from "tns-core-modules/data/observable";
import { getFrameById, Page, topmost } from "tns-core-modules/ui/frame";
import { SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";
import Log from "~/lib/cothority/log";
import { msgFailed, msgOK } from "~/lib/messages";
import { testingMode, uData } from "~/lib/user-data";
import { dismissSoftKeyboard } from "~/lib/users";
import { AttributesViewModel, Identity } from "./attributes-view";

let page: Page;
export let adminView: AttributesViewModel;

// Event handler for Page "navigatingTo" event attached in identity.xml
export function navigatingTo(args: EventData) {
    page = args.object as Page;
    adminView = new AttributesViewModel(uData);
    page.bindingContext = adminView;
}

export async function tapSave(args: EventData) {
    try {
        dismissSoftKeyboard();
        adminView.setProgress(localize("attributes.saving_attributes"), 10);
        const uid: Identity = page.bindingContext.userId;
        uData.contact.alias = uid.alias;
        uData.contact.email = uid.email;
        uData.contact.phone = uid.phone;
        uData.contact.url = uid.url;
        uData.personhoodPublished = uid.publishPersonhood;
        if (uData.contact.isRegistered()) {
            adminView.setProgress(localize("attributes.attributes_to_byzcoin"), 50);
        }
        await uData.save();
        adminView.setProgress(localize("progress.done"), 100);
        await msgOK(localize("dialog.data_saved"));
    } catch (e) {
        Log.catch(e);
        adminView.setProgress(localize("progress.error", e), -100);
        await msgFailed(localize("dialog.error", e.toString()));
    }
    adminView.setProgress();
}

export async function switchSettings(args: SelectedIndexChangedEventData) {
    Log.lvl3("switchSettings", args);
}
