import {fromObject} from "tns-core-modules/data/observable";
import {Page} from "tns-core-modules/ui/page";
import {Contact} from "~/lib/dynacred/Contact";
import { qrcodeIdentity } from "~/lib/qrcode";

let closeCallback: Function;

export function onShownModally(args) {
    const user = <Contact>args.context;
    closeCallback = args.closeCallback;
    const page: Page = <Page>args.object;
    page.bindingContext = fromObject({
        qrcode: qrcodeIdentity(user),
        alias: user.alias
    });
}

export async function goBack() {
    closeCallback();
}
