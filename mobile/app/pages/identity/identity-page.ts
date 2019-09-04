import { fromObject } from "tns-core-modules/data/observable";
import { EventData, Frame, getFrameById, Page, topmost } from "tns-core-modules/ui/frame";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";
import Log from "~/lib/cothority/log";

export let frame: Frame;

export function navigatingTo(args: EventData) {
    Log.lvl2("Navigating to identity");
    (args.object as Page).bindingContext = fromObject({});
}

export function goIdentity(args: GestureEventData) {
    frame = args.view.page.frame;
    return frame.navigate({
        moduleName: "pages/identity/attributes/attributes-page",
    });
}

export function goFriends(args: GestureEventData) {
    frame = args.view.page.frame;
    return frame.navigate({
        moduleName: "pages/identity/contacts/contacts-page",
    });
}

export function goRecover(args: GestureEventData) {
    frame = args.view.page.frame;
    return frame.navigate({
        moduleName: "pages/identity/recover/recover-page",
    });
}

export async function switchIdentity(args: SelectedIndexChangedEventData) {
    Log.print("switchIdentity");
    try {
        if (frame) {
            const ret = await frame.navigate("pages/identity/identity-page");
            frame = null;
            return ret;
        }
    } catch (e) {
        Log.catch(e);
    }
}
