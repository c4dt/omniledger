import {EventData, fromObject} from "tns-core-modules/data/observable";
import {getFrameById, Page, topmost} from "tns-core-modules/ui/frame";
import {mainView, mainViewRegister, mainViewRegistered} from "~/main-page";
import {SetupRecoverView} from "~/pages/setup/4-recover-view";
import Log from "~/lib/cothority/log";

let page: Page;
export let setupRecoverView: SetupRecoverView;

export function navigatingTo(args: EventData) {
    try {
        Log.print("navigating to 4");
        page = <Page>args.object;
        setupRecoverView = new SetupRecoverView();
        page.bindingContext = setupRecoverView;
    } catch(e){
        Log.catch(e);
    }
}

export async function cancelRecovery(){
    getFrameById("setup").navigate("pages/setup/2-alias");
}

export async function goMain(args: any = null) {
    await mainViewRegistered(args);
}

export function setProgress(text: string = "", width: number = 0) {
    setupRecoverView._networkStatus = width == 0 ? undefined : text;
    if (width != 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}
