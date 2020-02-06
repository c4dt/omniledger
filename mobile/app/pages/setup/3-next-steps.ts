// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import { getFrameById, Page } from "tns-core-modules/ui/frame";
import { appRootMain, appRootNav } from "~/app-root";
import { bcDef, initBC, uData } from "~/lib/byzcoin-def";
import { msgOK } from "~/lib/messages";
import { qrcodeIdentity, qrcodeIdentityStr } from "~/lib/qrcode";

export function navigatingTo(args: EventData) {
    const page = args.object as Page;
    page.bindingContext = fromObject({
        alias: uData.contact.alias,
        qrcode: qrcodeIdentity(uData.contact),
        testing: bcDef.testingMode,
    });
    Log.lvl1("Waiting to activate:\n", qrcodeIdentityStr(uData.contact));
}

export async function goMain(args: any) {
    return appRootMain();
}

export async function deleteAll(args: any) {
    try {
        await initBC();
        await uData.save();
    } catch (e) {
        Log.catch(e, "while resetting values");
    }
    await msgOK(localize("presenting.data_deleted"));
    return appRootNav("pages/setup/1-present");
}
