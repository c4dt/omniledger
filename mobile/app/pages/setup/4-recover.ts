// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { EventData } from "tns-core-modules/data/observable";
import { getFrameById, Page } from "tns-core-modules/ui/frame";
import { appRootMain, appRootNav } from "~/app-root";
import { SetupRecoverView } from "~/pages/setup/4-recover-view";

let page: Page;
export let setupRecoverView: SetupRecoverView;

export function navigatingTo(args: EventData) {
    try {
        page = args.object as Page;
        setupRecoverView = new SetupRecoverView();
        page.bindingContext = setupRecoverView;
    } catch (e) {
        Log.catch(e);
    }
}

export async function cancelRecovery() {
    appRootNav("pages/setup/2-alias");
}

export async function goMain(args: any = null) {
    appRootMain();
}

export function setProgress(text: string = "", width: number = 0) {
    setupRecoverView._networkStatus = width === 0 ? undefined : text;
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}
