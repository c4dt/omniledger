// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import { Page } from "tns-core-modules/ui/page";
import { SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";
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
