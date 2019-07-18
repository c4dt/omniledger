/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData, fromObject} from "tns-core-modules/data/observable";
import {getFrameById, Page} from "tns-core-modules/ui/frame";
import {Log} from "~/lib/Log";
import {gData} from "~/lib/Data";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {msgFailed} from "~/lib/ui/messages";
import {Defaults} from "~/lib/Defaults";

let input = fromObject({
    input: {
        alias: Defaults.Alias,
        email: "",
        phone: "",
        url: ""
    }
});

let page: Page;

export function navigatingTo(args: EventData) {
    page = <Page>args.object;
    page.bindingContext = input;
}

// Event handler for Page "navigatingTo" event attached in main-page.xml
export async function goNext(args: EventData) {
    let input = page.bindingContext.get("input");
    if (input.alias.length == 0) {
        return msgFailed("Please enter an alias")
    }
    gData.contact.alias = input.alias;
    gData.contact.email = input.email;
    gData.contact.phone = input.phone;
    gData.contact.url = input.url;
    try {
        await gData.save();
    } catch (e) {
        Log.catch(e);
    }
    getFrameById("setup").navigate("pages/setup/3-next-steps");
}
