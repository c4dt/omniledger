/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData, fromObject} from "tns-core-modules/data/observable";
import {Page} from "tns-core-modules/ui/page";
import {topmost} from "tns-core-modules/ui/frame";
import {RecoverView} from "~/pages/identity/recover/recover-view";
import {Contact} from "~/lib/Contact";
import {gData} from "~/lib/Data";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {msgFailed} from "~/lib/ui/messages";
import {Log} from "~/lib/Log";
import {viewScanModel} from "~/pages/lab/personhood/scan-atts/scan-atts-page";

let page: Page;
export let recoverView: RecoverView;

// Event handler for Page "navigatingTo" event attached in identity.xml
export function navigatingTo(args: EventData) {
    page = <Page>args.object;
    recoverView = new RecoverView();
    page.bindingContext = recoverView;
}

export function sliderLoaded(args) {
    const slider = args.object;

    slider.on("valueChange", (args) => {
        recoverView.sliderChange(args.value);
    })
}

export function goBack() {
    topmost().goBack();
}

export async function addTrustee() {
    let contacts: Contact[] = [];
    gData.friends.forEach(f => {
        if (f.isRegistered()) {
            if (gData.recoverySignatures.filter(rs => {
                rs.credentialIID.equals(f.credentialIID);
            }).length == 0) {
                contacts.push(f);
            }
        }
    });
    if (contacts.length == 0) {
        return msgFailed("No untrusted but registered contact found");
    }
    let ret = await dialogs.action({
        message: "Chose trustee",
        cancelButtonText: "Cancel",
        actions: contacts.map(c => c.alias),
    });
    let contact = contacts.filter(c => c.alias == ret);
    switch (contact.length) {
        case 0:
            return;
        case 1:
            try {
                await contact[0].update(gData.bc);
                let recover = gData.contact.recover;
                await recover.addTrustee(contact[0]);
                recoverView._changed = true;
                recover.threshold += 1;
                await recoverView.updateTrustees();
            } catch (e) {
                Log.catch(e);
                return msgFailed(e.toString(), "Adding Trustee");
            }
            break;
        default:
            return msgFailed("Oups - got more than one contact with the same alias - sorry, cannot handle that :(");
    }
}

export function setProgress(text: string = "", width: number = 0) {
    recoverView._networkStatus = width == 0 ? undefined : text;
    if (width != 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}

export async function save() {
    setProgress("Storing Credentials", 50);
    await gData.save();
    recoverView._changed = false;
    setProgress();
}

export async function recoverUser() {
    let contacts = await gData.searchRecovery();
    let aliases = contacts.map(c => c.alias);
    let userAlias = await dialogs.action({
        title: "Recover user",
        message: "Chose which user you want to recover",
        cancelButtonText: "Cancel",
        actions: aliases,
    });
    if (userAlias == "Cancel") {
        return;
    }
    let user = contacts.filter(c => c.alias == userAlias);
    if (user.length == 0) {
        return msgFailed("Couldn't find user", userAlias);
    }
    topmost().navigate({
        moduleName: "pages/identity/recover/showRecovery/showRecovery-page",
        context: user[0]
    });
}