// tslint:disable-next-line
require("nativescript-nodeify");

import { Contact } from "~/lib/dynacred";
import { fromObject } from "tns-core-modules/data/observable";
import { Page } from "tns-core-modules/ui/page";
import { qrcodeIdentity } from "~/lib/qrcode";

let closeCallback: () => null;

export function onShownModally(args) {
    const user = args.context as Contact;
    closeCallback = args.closeCallback;
    const page: Page = args.object as Page;
    page.bindingContext = fromObject({
        alias: user.alias,
        qrcode: qrcodeIdentity(user),
    });
}

export async function goBack() {
    closeCallback();
}
