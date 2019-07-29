/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData, fromObject } from "tns-core-modules/data/observable";
import { getFrameById, Page } from "tns-core-modules/ui/frame";
import Log from "~/lib/cothority/log";
import { Defaults } from "~/lib/dynacred/Defaults";
import { msgOK } from "~/lib/messages";
import { qrcodeIdentity, qrcodeIdentityStr } from "~/lib/qrcode";
import { uData } from "~/user-data";
import { Button } from "tns-core-modules/ui/button";

export function navigatingTo(args: EventData) {
    let page = <Page> args.object;
    page.bindingContext = fromObject({
        alias: uData.contact.alias,
        qrcode: qrcodeIdentity(uData.contact),
        testing: Defaults.Testing,
    });
    Log.lvl1("Waiting to activate:\n", qrcodeIdentityStr(uData.contact));
}

export async function goMain(args: any) {
	const button: Button = <Button>args.object;
    button.page.frame.navigate("pages/home/home-page");
}

export async function deleteAll(args: any) {
    try {
        await uData.delete();
        await uData.save();
    } catch (e) {
        Log.catch(e, "while resetting values");
    }
    await msgOK("Deleted all data");
    return getFrameById("setup").navigate({
        moduleName: "pages/setup/1-present",
        // Page navigation, without saving navigation history.
        backstackVisible: false
    });
}
