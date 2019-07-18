/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData} from "tns-core-modules/data/observable";
import {getFrameById, Page, topmost} from "tns-core-modules/ui/frame";
import {gData} from "~/lib/Data";
import {Admin, AdminViewModel} from "./settings-view";
import {Log} from "~/lib/Log"
import * as dialogs from "tns-core-modules/ui/dialogs";
import {Defaults} from "~/lib/Defaults";
import {SelectedIndexChangedEventData} from "tns-core-modules/ui/tab-view";
import {msgFailed, msgOK} from "~/lib/ui/messages";
import {mainView, mainViewRegister} from "~/main-page";
import {ShareFile} from "nativescript-share-file";
import {Documents} from "~/lib/FileIO";
import {openUrl} from "tns-core-modules/utils/utils";

let page: Page;
export let adminView: AdminViewModel;

// Event handler for Page "navigatingTo" event attached in identity.xml
export function navigatingTo(args: EventData) {
    page = <Page>args.object;
    adminView = new AdminViewModel(gData);
    page.bindingContext = adminView;
}

export async function tapClear(args: EventData) {
    const page = <Page>args.object;
    if (!Defaults.Confirm) {
        gData.delete();
        await gData.save();
        mainViewRegister(args);
    } else {
        if (await dialogs.confirm("Do you really want to delete everything? There is no way back!") &&
            await dialogs.confirm("You will lose all your data! No way back!")) {
            await gData.delete();
            await gData.save();
            await msgOK("ALL YOUR DATA HAS BEEN DELETED!");
            mainView.set("showGroup", 1);
            return getFrameById("setup").navigate({
                moduleName: "pages/setup/1-present",
                // Page navigation, without saving navigation history.
                backstackVisible: false
            });

        }
    }
}

export async function shareData(args: EventData){
    let shareFile = new ShareFile();
    await gData.save();
    await shareFile.open(
        {
            path: "/data/user/0/online.personhood/files/storage/data.json",
            intentTitle: 'Open text file with:', // optional Android
            rect: { // optional iPad
                x: 110,
                y: 110,
                width: 0,
                height: 0
            },
            options: false, // optional iOS
            animated: true // optional iOS
        });
}

export async function tapSave(args: EventData) {
    let a: Admin = page.bindingContext.admin;
    gData.continuousScan = a.continuousScan;
    await gData.save();
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

