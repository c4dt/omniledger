import * as dialogs from "tns-core-modules/ui/dialogs";

const okStrs = ["Cool", "Nice", "This rocks", "Wonderful", "Fantastic", "Best", ":stars:"];
let okIndex = -1;

const failedStrs = ["Too bad", "Shame", "Try later", "Dang", "Why?", "Life's hard", "This sucks"];
let failedIndex = -1;

export function getOK(): string {
    okIndex = (okIndex + 1) % okStrs.length;
    return okStrs[okIndex];
}

export async function msgOK(msg: string, title?: string) {
    return dialogs.alert({
        message: msg,
        okButtonText: getOK(),
        title: title ? title : "Success",
    });
}

export async function msgOKCancel(msg: string, ok: string, cancel: string, title?: string): Promise<boolean> {
    return dialogs.confirm({
        cancelButtonText: cancel,
        message: msg,
        okButtonText: ok,
        title: title ? title : "Please chose",
    });
}

export function getFailed(): string {
    failedIndex = (failedIndex + 1) % failedStrs.length;
    return failedStrs[failedIndex];
}

export async function msgFailed(msg: string, title?: string) {
    return dialogs.alert({
        message: msg,
        okButtonText: getFailed(),
        title: title ? title : "Failure",
    });
}
