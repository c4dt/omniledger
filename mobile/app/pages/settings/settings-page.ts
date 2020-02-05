// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { WebSocketConnection } from "@dedis/cothority/network/connection";
import { localize } from "nativescript-localize";
import { ShareFile } from "nativescript-share-file";
import { EventData } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { getFrameById, Page, topmost } from "tns-core-modules/ui/frame";
import { SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";
import { openUrl } from "tns-core-modules/utils/utils";
import { appRootSetup } from "~/app-root";
import { bcDef, initBC, uData } from "~/lib/byzcoin-def";
import { msgFailed, msgOK } from "~/lib/messages";
import { Admin, AdminViewModel } from "./settings-view";

let page: Page;
export let adminView: AdminViewModel;
export let nodeList: WebSocketConnection[];

// Event handler for Page "navigatingTo" event attached in identity.xml
export function navigatingTo(args: EventData) {
    page = args.object as Page;
    adminView = new AdminViewModel(uData);
    page.bindingContext = adminView;
}

export async function tapClear(args: EventData) {
    if (!bcDef.testingMode) {
        if (await dialogs.confirm(localize("settings.clear_confirm_1")) &&
            await dialogs.confirm(localize("settings.clear_confirm_2"))) {
            await initBC();
            await uData.save();
            await msgOK(localize("settings.data_deleted"));
        } else {
            return;
        }
    }
    appRootSetup();
}

export async function tapSave(args: EventData) {
    const a: Admin = page.bindingContext.admin;
    uData.continuousScan = a.continuousScan;
    await uData.save();
    await msgOK(localize("dialog.data_saved"));
}

export async function switchSettings(args: SelectedIndexChangedEventData) {
    Log.lvl3("switchSettings", args);
}

export function goPersonhood() {
    openUrl("https://oh19.c4dt.org");
}

export function goGithub() {
    openUrl("https://github.com/c4dt/omniledger");
}

export function setNodeList(list: WebSocketConnection[]) {
    nodeList = list.slice();
}
