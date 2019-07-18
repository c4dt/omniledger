/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData, fromObject} from "tns-core-modules/data/observable";
import {getFrameById, Page, topmost} from "tns-core-modules/ui/frame";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {gData} from "~/lib/Data";
import {Log} from "~/lib/Log";
import {Contact} from "~/lib/Contact";
import {msgFailed, msgOK} from "~/lib/ui/messages";
import {mainView, mainViewRegister, mainViewRegistered} from "~/main-page";
import {Defaults} from "~/lib/Defaults";

export function navigatingTo(args: EventData) {
    let page = <Page>args.object;
    page.bindingContext = fromObject({
        alias: gData.contact.alias,
        qrcode: gData.contact.qrcodeIdentity(),
        testing: Defaults.TestButtons,
    });
    Log.lvl1("Waiting to activate:\n", gData.contact.qrcodeIdentityStr());
}

export async function deleteAll(args: any) {
    try {
        await gData.delete();
        await gData.save();
    } catch (e) {
        Log.catch(e, "while resetting values");
    }
    return getFrameById("setup").navigate({
        moduleName: "pages/setup/1-present",
        // Page navigation, without saving navigation history.
        backstackVisible: false
    });
    await msgOK("Deleted all data");
    // return gotoMain("Deleted all data");
}

export async function goMain(args: any = null) {
    await mainViewRegistered(args);
}
