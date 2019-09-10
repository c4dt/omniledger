/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData, fromObject } from "tns-core-modules/data/observable";
import { getFrameById, Page } from "tns-core-modules/ui/frame";
import { appRootNav } from "~/app-root";
import Log from "~/lib/cothority/log";
import { msgFailed } from "~/lib/messages";
import { initData, uData } from "~/lib/user-data";

let page: Page;

export async function navigatingTo(args: EventData) {
    page = args.object as Page;
    page.bindingContext = fromObject({
        input: {
            alias: "",
            email: "",
            phone: "",
            url: "",
        },
    });
    await initData();
}

// Event handler for Page "navigatingTo" event attached in main-page.xml
export async function goNext(args: EventData) {
    const input = page.bindingContext.get("input");
    if (input.alias.length === 0) {
        return msgFailed("Please enter an alias");
    }
    uData.contact.alias = input.alias;
    uData.contact.email = input.email;
    uData.contact.phone = input.phone;
    uData.contact.url = input.url;
    try {
        await uData.save();
    } catch (e) {
        Log.catch(e);
    }
    appRootNav("pages/setup/3-next-steps");
}
