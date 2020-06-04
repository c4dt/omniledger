/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { GroupContractCollection } from "../../../../lib/dynacred";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { EventData, Page } from "tns-core-modules/ui/page/page";
import { uData } from "~/lib/byzcoin-def";
import { scanNewGroupContract } from "~/lib/group-ui";
import { GroupContractListView } from "./details-view";

export let detailsList: GroupContractListView;
let page: Page;
let groupContractCollection: GroupContractCollection;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    groupContractCollection = page.navigationContext.gcCollection as GroupContractCollection;
    detailsList = new GroupContractListView(page.navigationContext.gcCollection);
    page.bindingContext = detailsList;
}

export function goBack() {
    return topmost().goBack();
}

/**
 * Triggered when clicking the add button in the ActionBar
 *
 */
export async function updateGroup() {
    const updatedGroupContractCollection = await scanNewGroupContract(groupContractCollection, uData.keyIdentity);
    if (updatedGroupContractCollection) {
        uData.addGroup(updatedGroupContractCollection);
        await uData.save();
        detailsList.updateGroupContractList(updatedGroupContractCollection);
    }
}
