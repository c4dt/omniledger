/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData, fromObject} from "tns-core-modules/data/observable";
import {gData} from "~/lib/Data";
import {Page} from "tns-core-modules/ui/page";
import {Log} from "~/lib/Log";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {GestureEventData} from "tns-core-modules/ui/gestures";
import {Contact} from "~/lib/Contact";
import * as Long from "long";
import {assertRegistered, scanNewUser} from "~/lib/ui/users";
import {ObservableArray} from "tns-core-modules/data/observable-array";
import {ItemEventData} from "tns-core-modules/ui/list-view";
import {ContactsView} from "~/pages/identity/contacts/contacts-view";
import {Label} from "tns-core-modules/ui/label";

export let contacts: ContactsView;
let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export function navigatingTo(args: EventData) {
    contacts = new ContactsView(gData.friends);
    page = <Page>args.object;
    page.bindingContext = contacts;
    friendsUpdateList();
}

export function friendsUpdateList() {
    contacts.updateUsers(gData.friends);
}

export async function addFriend(args: GestureEventData) {
    try {
        let u = await scanNewUser(gData);
        await assertRegistered(u, setProgress);
        friendsUpdateList();
        await gData.save();
    } catch (e){
        Log.error(e);
    }
}

export function setProgress(text: string = "", width: number = 0) {
    contacts.set("networkStatus", width == 0 ? undefined : text);
    if (width != 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}

