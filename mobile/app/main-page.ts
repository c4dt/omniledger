// tslint:disable-next-line
require("nativescript-nodeify");

import { EventData, fromObject } from "data/observable";
import { SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";
import { Page } from "ui/page";
import Log from "~/lib/cothority/log";
import { switchHome } from "~/pages/home/home-page";
import { switchIdentity } from "~/pages/identity/identity-page";
import { switchLab } from "~/pages/lab/lab-page";
import { switchSettings } from "~/pages/settings/settings-page";

export async function navigatingTo(args: EventData) {
    (args.object as Page).bindingContext = fromObject({});
}

export async function onChangeTab(args: SelectedIndexChangedEventData) {
    Log.lvl2("onchangetab", args.newIndex);
    switch (args.newIndex) {
        case 0:
            await switchHome(args);
            break;
        case 1:
            await switchIdentity(args);
            break;
        case 2:
            await switchLab(args);
            break;
        case 3:
            await switchSettings(args);
            break;
    }
}
