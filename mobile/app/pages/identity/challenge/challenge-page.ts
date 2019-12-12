/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import Long from "long";
import { localize } from "nativescript-localize";
import { EventData } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Page } from "tns-core-modules/ui/frame";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed } from "~/lib/messages";
import { frame } from "~/pages/identity/identity-page";
import { ChallengeViewModel } from "./challenge-view";

let page: Page;
export let adminView: ChallengeViewModel;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    adminView = new ChallengeViewModel(uData);
    page.bindingContext = adminView;
    if (!uData.contact.isRegistered()) {
        await msgFailed(localize("challenge.need_register"));
        return frame.navigate("pages/home/home-page");
    }
    const joined = uData.contact.credential.getAttribute("1-public", "challenge");
    if (!joined) {
        // tslint:disable:object-literal-sort-keys
        const join = await dialogs.confirm({
            title: localize("challenge.join_title"),
            message: localize("challenge.join_msg"),
            okButtonText: localize("challenge.join_ok"),
            cancelButtonText: localize("challenge.join_cancel"),
            // tslint:enable:object-literal-sort-keys
        });
        if (!join) {
            return frame.navigate("pages/home/home-page");
        }
        uData.contact.joinedChallenge = Long.fromNumber(Date.now());
        await uData.save();
    }
    await adminView.updateList();
}

export async function updateList() {
    return adminView.updateList();
}

export async function resetDate() {
    uData.contact.joinedChallenge = Long.fromNumber(Date.now());
    await uData.save();
    await adminView.updateList();
}
