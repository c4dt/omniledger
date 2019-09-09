/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData } from "tns-core-modules/data/observable";
import { Page } from "tns-core-modules/ui/frame";
import { uData } from "~/lib/user-data";
import { ChallengeViewModel } from "./challenge-view";

let page: Page;
export let adminView: ChallengeViewModel;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    adminView = new ChallengeViewModel(uData);
    page.bindingContext = adminView;
    await adminView.updateList();
}

export async function updateList() {
    return adminView.updateList();
}
