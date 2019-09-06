import Log from "~/lib/cothority/log";
import { Contact } from "~/lib/dynacred/Contact";
import { Data } from "~/lib/dynacred/Data";

import { isAndroid, isIOS } from "tns-core-modules/platform";
import * as frame from "tns-core-modules/ui/frame";
import * as utils from "tns-core-modules/utils/utils";
import { scan } from "~/lib/scan";

export function dismissSoftKeyboard() {
    if (isIOS) {
        frame.topmost().nativeView.endEditing(true);
    }
    if (isAndroid) {
        utils.ad.dismissSoftInput();
    }
}

export async function scanNewUser(d: Data): Promise<Contact> {
    const str = await scan("Scan Identity Code");
    // const str = {format: "QR_CODE", text: "test from qrcode"};
    Log.lvl2("Got scan:", str);
    if (!str.format || ( str.format !== "QR_CODE" && str.format !== "org.iso.QRCode")) {
        throw(new Error("Did not find a QR code."));
    }
    return await Contact.fromQR(d.bc, str.text);
}
