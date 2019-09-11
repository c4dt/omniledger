/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData } from "tns-core-modules/data/observable";
import { Page } from "tns-core-modules/ui/frame";
import * as dialogs from "ui/dialogs";
import { msgOK } from "~/lib/messages";
import { uData } from "~/lib/user-data";
import { frame } from "~/pages/identity/identity-page";
import { ChallengeViewModel } from "./challenge-view";

let page: Page;
export let adminView: ChallengeViewModel;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    adminView = new ChallengeViewModel(uData);
    page.bindingContext = adminView;
    const joined = uData.contact.credential.getAttribute("1-public", "challenge");
    if (!joined) {
        // tslint:disable:object-literal-sort-keys
        const join = await dialogs.confirm({
            title: "Join challenge",
            message: "By joining the challenge you reveal your data for anybody to see it. Do you agree?",
            okButtonText: "Reveal and join",
            cancelButtonText: "Don't participate",
            // tslint:enable:object-literal-sort-keys
        });
        if (!join) {
            return frame.navigate("pages/home/home-page");
        }
        uData.contact.credential.setAttribute("1-public", "challenge", Buffer.from("true"));
        uData.contact.incVersion();
        uData.save();
    }
    await adminView.updateList();
}

export async function updateList() {
    return adminView.updateList();
}
