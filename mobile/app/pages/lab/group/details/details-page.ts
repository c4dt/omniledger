/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { topmost } from "tns-core-modules/ui/frame/frame";
import { EventData, Page } from "tns-core-modules/ui/page/page";
import { GroupContractListView } from "./details-view";

export let detailsList: GroupContractListView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    detailsList = new GroupContractListView(page.navigationContext.gcCollection);
    page.bindingContext = detailsList;
}

export function goBack() {
    return topmost().goBack();
}
