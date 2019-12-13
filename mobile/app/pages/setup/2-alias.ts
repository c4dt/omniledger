// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import { getFrameById, Page } from "tns-core-modules/ui/frame";
import { appRootNav } from "~/app-root";
import { initData, uData } from "~/lib/byzcoin-def";
import { msgFailed } from "~/lib/messages";

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
