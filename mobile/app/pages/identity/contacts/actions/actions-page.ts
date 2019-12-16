// tslint:disable-next-line
require("nativescript-nodeify");

import { Contact } from "~/lib/dynacred";
import { available, compose } from "nativescript-email";
import { dial, requestCallPermission } from "nativescript-phone";
import { fromObject } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { openUrl } from "tns-core-modules/utils/utils";
import { msgFailed } from "~/lib/messages";

let user: Contact;

export function navigatingTo(args) {
    const page: Page = args.object as Page;
    user = page.navigationContext as Contact;
    page.bindingContext = fromObject({
        alias: user.alias,
        email: user.email,
        phone: user.phone,
        url: user.url,
    });
}

export async function tapEmail() {
    try {
        if (await available()) {
            await compose({
                subject: "From Personhood",
                to: [user.email],
            });
        } else {
            openUrl("mailto:test@test.com");
            // await msgFailed("Email not available");
        }
    } catch (e) {
        await msgFailed("Couldn't send email");
    }
}

export async function tapPhone() {
    requestCallPermission("Allow calling this number?")
        .then(() => {
            dial(user.phone, false);
        })
        .catch(() => {
            dial(user.phone, true);
        });
}

export async function tapUrl() {
    let u = user.url;
    if (!u.startsWith("http")) {
        u = "https://" + u;
    }
    try {
        openUrl(u);
    } catch (e) {
        await msgFailed("Couldn't open " + u);
    }
}

export async function goBack() {
    topmost().goBack();
}
