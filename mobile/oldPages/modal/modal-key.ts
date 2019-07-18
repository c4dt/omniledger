import {fromObject} from "tns-core-modules/data/observable";
import {Page} from "tns-core-modules/ui/page";
import {Contact} from "~/lib/Contact";

let closeCallback: Function;

export function onShownModally(args) {
    const qrcode = <Contact>args.context;
    closeCallback = args.closeCallback;
    const page: Page = <Page>args.object;
    page.bindingContext = fromObject({
        qrcode: qrcode,
    });
}

export async function goBack() {
    closeCallback();
}