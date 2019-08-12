/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { ShareFile } from "nativescript-share-file";
import { EventData } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { getFrameById, Page, topmost } from "tns-core-modules/ui/frame";
import { SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";
import { openUrl } from "tns-core-modules/utils/utils";
import { appRootSetup } from "~/app-root";
import Log from "~/lib/cothority/log";
import { msgFailed, msgOK } from "~/lib/messages";
import { initBC, testingMode, uData } from "~/lib/user-data";
import { Admin, AdminViewModel } from "./settings-view";

let page: Page;
export let adminView: AdminViewModel;

// Event handler for Page "navigatingTo" event attached in identity.xml
export function navigatingTo(args: EventData) {
    page = args.object as Page;
    adminView = new AdminViewModel(uData);
    page.bindingContext = adminView;
}

export async function tapClear(args: EventData) {
    if (!testingMode) {
        if (await dialogs.confirm("Do you really want to delete everything? There is no way back!") &&
            await dialogs.confirm("You will lose all your data! No way back!")) {
            await initBC();
            await uData.save();
            await msgOK("ALL YOUR DATA HAS BEEN DELETED!");
        } else {
            return;
        }
    }
    appRootSetup();
}

export async function shareData(args: EventData) {
    const shareFile = new ShareFile();
    await uData.save();
    // tslint:disable:object-literal-sort-keys
    await shareFile.open(
        {
            path: "/data/user/0/online.personhood/files/storage/data.json",
            intentTitle: "Open text file with:", // optional Android
            rect: { // optional iPad
                x: 110,
                y: 110,
                width: 0,
                height: 0,
            },
            options: false, // optional iOS
            animated: true, // optional iOS
        });
    // tslint:enable:object-literal-sort-keys
}

export async function tapSave(args: EventData) {
    const a: Admin = page.bindingContext.admin;
    uData.continuousScan = a.continuousScan;
    await uData.save();
    await msgOK("Saved your data");
}

export async function switchSettings(args: SelectedIndexChangedEventData) {
    Log.lvl3("switchSettings", args);
}

export function goPersonhood() {
    openUrl("https://personhood.online");
}

export function goGithub() {
    openUrl("https://github.com/dedis/personhood.online");
}
