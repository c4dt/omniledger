// tslint:disable-next-line
require("nativescript-nodeify");

import { Contact } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed } from "~/lib/messages";
import { RecoverView } from "~/pages/identity/recover/recover-view";
import { viewScanModel } from "~/pages/lab/personhood/scan-atts/scan-atts-page";

let page: Page;
export let recoverView: RecoverView;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    recoverView = new RecoverView();
    page.bindingContext = recoverView;
    await recoverView.updateTrustees();
}

export function sliderLoaded(args) {
    const slider = args.object;

    slider.on("valueChange", (a) => {
        recoverView.sliderChange(a.value);
    });
}

export function goBack() {
    topmost().goBack();
}

export async function addTrustee() {
    const contacts: Contact[] = [];
    uData.contacts.forEach((f) => {
        if (f.isRegistered()) {
            if (uData.recoverySignatures.filter((rs) => {
                rs.credentialIID.equals(f.credentialIID);
            }).length === 0) {
                contacts.push(f);
            }
        }
    });
    if (contacts.length === 0) {
        return msgFailed("No untrusted but registered contact found");
    }
    // tslint:disable:object-literal-sort-keys
    const ret = await dialogs.action({
        message: "Chose trustee",
        cancelButtonText: "Cancel",
        actions: contacts.map((c) => c.alias),
    });
    const contact = contacts.filter((c) => c.alias === ret);
    switch (contact.length) {
        case 0:
            return;
        case 1:
            try {
                await contact[0].updateOrConnect(uData.bc);
                const recover = uData.contact.recover;
                await recover.addTrustee(contact[0]);
                recoverView._changed = true;
                recover.threshold += 1;
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
    recoverView._networkStatus = width === 0 ? undefined : text;
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}

export async function save() {
    setProgress("Storing Credentials", 50);
    await uData.save();
    recoverView._changed = false;
    setProgress();
}

export async function recoverUser() {
    const contacts = await uData.searchRecovery();
    const aliases = contacts.map((c) => c.alias);
    const userAlias = await dialogs.action({
        title: "Recover user",
        message: "Chose which user you want to recover",
        cancelButtonText: "Cancel",
        actions: aliases,
    });
    if (userAlias === "Cancel") {
        return;
    }
    const user = contacts.filter((c) => c.alias === userAlias);
    if (user.length === 0) {
        return msgFailed("Couldn't find user", userAlias);
    }
    topmost().navigate({
        moduleName: "pages/identity/recover/showRecovery/showRecovery-page",
        context: user[0],
    });
}
