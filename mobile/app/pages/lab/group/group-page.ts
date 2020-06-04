/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { GroupContractCollection } from "../../../lib/dynacred";
import { EventData } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { GestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { Page } from "tns-core-modules/ui/page";
import { uData } from "~/lib/byzcoin-def";
import { scanNewGroupContract } from "~/lib/group-ui";
import { msgFailed } from "~/lib/messages";
import { GroupListView } from "~/pages/lab/group/group-view";

export let groupList: GroupListView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    groupList = new GroupListView();
    page.bindingContext = groupList;
}

/**
 * Display an action dialog which ask how to create a group
 *
 */
export async function createGroup(args: GestureEventData) {
    const propose = "Design a Group Definition";
    const scanQr = "Scan a Group Contract";
    const actions = [propose, scanQr];
    const cancel = "Cancel";

    try {
        // tslint:disable: object-literal-sort-keys
        const action = await dialogs.action({
            message: "How do you want to create a new group",
            cancelButtonText: cancel,
            actions,
        });

        switch (action) {
            case propose:
                return topmost().navigate({
                    moduleName: "pages/lab/group/configure/configure-page",
                    context: {
                        isReadOnly: false,
                    },
                });
            case scanQr:
                const gcCollection = await scanNewGroupContract(new GroupContractCollection(), uData.keyIdentity);
                // only save if the group contact was accepted or kept
                if (gcCollection.collection.size !== 0) {
                    uData.addGroup(gcCollection);
                    await uData.save();
                    groupList.updateGroupList();
                }
                break;
        }
    } catch (e) {
        await msgFailed(e.toString(), "Error");
    }
}
