/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData} from "tns-core-modules/data/observable";
import {getFrameById, Page, topmost} from "tns-core-modules/ui/frame";
import {uData} from "~/user-data";
import {Identity, AttributesViewModel} from "./attributes-view";
import Log from "~/lib/cothority/log"
import * as dialogs from "tns-core-modules/ui/dialogs";
import {Defaults} from "~/lib/dynacred/Defaults";
import {SelectedIndexChangedEventData} from "tns-core-modules/ui/tab-view";
import {msgFailed, msgOK} from "~/lib/messages";
import {mainView, mainViewRegister} from "~/main-page";
import {dismissSoftKeyboard} from "~/lib/users";

let page: Page;
export let adminView: AttributesViewModel;

// Event handler for Page "navigatingTo" event attached in identity.xml
export function navigatingTo(args: EventData) {
    page = <Page>args.object;
    adminView = new AttributesViewModel(uData);
    page.bindingContext = adminView;
}

export async function tapClear(args: EventData) {
    const page = <Page>args.object;
    if (Defaults.Testing) {
        uData.delete();
        await uData.save();
        mainViewRegister(args);
    } else {
        if (await dialogs.confirm("Do you really want to delete everything? There is no way back!") &&
            await dialogs.confirm("You will lose all your data! No way back!")) {
            await uData.delete();
            await uData.save();
            await msgOK("ALL YOUR DATA HAS BEEN DELETED!");
            mainView.set("showGroup", 1);
            return getFrameById("setup").navigate({
                moduleName: "pages/setup/1-present",
                // Page navigation, without saving navigation history.
                backstackVisible: false
            });

        }
    }
}

export async function tapSave(args: EventData) {
    try {
        dismissSoftKeyboard();
        adminView.setProgress("Saving Attributes", 10);
        let uid: Identity = page.bindingContext.userId;
        uData.contact.alias = uid.alias;
        uData.contact.email = uid.email;
        uData.contact.phone = uid.phone;
        uData.contact.url = uid.url;
        uData.personhoodPublished = uid.publishPersonhood;
        if (uData.contact.isRegistered()) {
            adminView.setProgress("Sending Attributes to ByzCoin", 50);
        }
        await uData.save();
        adminView.setProgress("Done", 100);
        await msgOK("Saved your data");
    } catch (e) {
        adminView.setProgress("Error: " + e, -100);
        await msgFailed("Something went wrong: " + e.toString());
    }
    adminView.setProgress();
}

export async function switchSettings(args: SelectedIndexChangedEventData) {
    Log.lvl3("switchSettings", args);
}

