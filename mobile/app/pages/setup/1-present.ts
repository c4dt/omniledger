/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData, fromObjectRecursive, Observable} from "tns-core-modules/data/observable";
import {getFrameById, Page} from "tns-core-modules/ui/frame";
import * as dialogs from "tns-core-modules/ui/dialogs";
import Log from "~/lib/cothority/log";
import { TestData } from "~/lib/dynacred/Data";
import {Defaults} from "~/lib/dynacred/Defaults";
import {Label} from "tns-core-modules/ui/label";
import {mainView} from "~/main-page";
import {openUrl} from "tns-core-modules/utils/utils";
import { uData } from "~/user-data";

let view: Observable = fromObjectRecursive({
    networkStatus: undefined,
    testing: Defaults.Testing,
});
let page: Page;

export async function navigatingTo(args: EventData) {
    Log.lvl2("navigatingTo: 1-present");
    page = <Page>args.object;
    page.bindingContext = view;
    setProgress();
    return uData.connectByzcoin();
}

export async function goInitTest(args: EventData) {
    try {
        setProgress("creating ByzCoin", 30);
        let td = await TestData.init("admin");

        setProgress("verify registration", 70);
        await uData.contact.updateOrConnect(uData.bc);

        setProgress("saving", 100);
        await uData.save();
        mainView.set("showGroup", 2);
    } catch (e) {
        await Log.rcatch(e);
    }
    return goAlias(args);
}

export async function goReloadBC(args: EventData) {
    try {
        // let ts = await TestStore.load(Defaults.Roster);
        // Defaults.ByzCoinID = ts.bcID;
        // Defaults.SpawnerIID = ts.spawnerIID.iid;
        uData.delete();
        await uData.connectByzcoin();
        Log.print("uData.bc is:", uData.bc);
    } catch (e) {
        return Log.rcatch(e);
    }
    return goAlias(args);
}

export function goAlias(args: EventData) {
    return getFrameById("setup").navigate("pages/setup/2-alias");
}

export function goPersonhood() {
    openUrl("https://personhood.online");
}

export async function goRecover(args: EventData){
    let doit = await dialogs.confirm({
        title: "Start Recovery",
        message: "Did you lose your identity and have set up contacts to recover it?",
        okButtonText: "Recover",
        cancelButtonText: "Abort"
    });
    if (doit){
        Log.print("going to recover");
        try {
            getFrameById("setup").navigate("pages/setup/4-recover");
        } catch(e){
            Log.catch(e);
        }
    }
}

export function setProgress(text: string = "", width: number = 0) {
    view.set("networkStatus", width == 0 ? undefined : text);
    if (width != 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}

