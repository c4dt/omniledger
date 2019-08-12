/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData } from "tns-core-modules/data/observable";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { Page } from "tns-core-modules/ui/page";
import Log from "~/lib/cothority/log";
import { msgFailed } from "~/lib/messages";
import { uData } from "~/lib/user-data";
import { scanNewUser } from "~/lib/users";
import { ContactsView } from "~/pages/identity/contacts/contacts-view";

export let contacts: ContactsView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export function navigatingTo(args: EventData) {
    contacts = new ContactsView(uData.contacts);
    page = args.object as Page;
    page.bindingContext = contacts;
    friendsUpdateList();
}

export function friendsUpdateList() {
    contacts.updateUsers(uData.contacts);
}

export async function addFriend(args: GestureEventData) {
    try {
        const u = await scanNewUser(uData);
        await u.isRegistered();
        friendsUpdateList();
        await uData.save();
    } catch (e) {
        Log.catch(e);
        await msgFailed(e);
    }
}

export function setProgress(text: string = "", width: number = 0) {
    contacts.set("networkStatus", width === 0 ? undefined : text);
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}
