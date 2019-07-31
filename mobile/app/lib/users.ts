import {scan} from "~/lib/dynacred/Scan";
import Log from "~/lib/cothority/log";
import {Data} from "~/lib/dynacred/Data";
import {Contact} from "~/lib/dynacred/Contact";
import * as dialogs from "tns-core-modules/ui/dialogs";
import Long from "long";

import * as utils from "tns-core-modules/utils/utils";
import {isIOS, isAndroid} from "tns-core-modules/platform";
import * as frame from "tns-core-modules/ui/frame";

export function dismissSoftKeyboard() {
    if (isIOS) {
        frame.topmost().nativeView.endEditing(true);
    }
    if (isAndroid) {
        utils.ad.dismissSoftInput();
    }
}

export async function scanNewUser(d: Data): Promise<Contact> {
    let str = await scan("Scan Identity Code");
    //const str = {format: "QR_CODE", text: "test from qrcode"};
    Log.lvl2("Got scan:", str);
    if (!str.format || str.format !== "QR_CODE") {
        throw(new Error("Did not find a QR code."));
    }
    let user = await Contact.fromQR(d.bc, str.text);
    await d.addContact(user);
    await d.save();
    return user;
}

export async function assertRegistered(u: Contact, setProgress: Function): Promise<boolean> {
    if (u.isRegistered()) {
        return true;
    }
    return false;
}