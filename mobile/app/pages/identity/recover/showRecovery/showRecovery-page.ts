import { fromObject } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import Log from "~/lib/cothority/log";
import { Contact } from "~/lib/dynacred/Contact";
import { msgFailed } from "~/lib/messages";
import { createQrcode, scan } from "~/lib/scan";
import { uData } from "~/lib/user-data";

let user: Contact;
const context = fromObject({qrcode: null});

export async function navigatingTo(args) {
    const page: Page = args.object as Page;
    user = page.navigationContext as Contact;
    page.bindingContext = context;
    try {
        const contactScan = await scan("Please scan contact's recovery request");
        const sig = await uData.recoverySignature(contactScan.text, user);
        context.set("qrcode", createQrcode(sig));
    } catch (e) {
        Log.catch(e);
        await msgFailed(e.toString(), "Error");
        return goBack();
    }
}

export async function goBack() {
    return topmost().goBack();
}
