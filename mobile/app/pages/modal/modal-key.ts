import { fromObject } from "tns-core-modules/data/observable";
import { Page } from "tns-core-modules/ui/page";
import { Contact } from "~/lib/dynacred/Contact";

let closeCallback: () => null;

export function onShownModally(args) {
    const qrcode = args.context as Contact;
    closeCallback = args.closeCallback;
    const page: Page = args.object as Page;
    page.bindingContext = fromObject({
        qrcode,
    });
}

export async function goBack() {
    closeCallback();
}
