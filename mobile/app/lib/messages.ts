import { localize } from "nativescript-localize";
import * as dialogs from "tns-core-modules/ui/dialogs";

const okStrs = [
    localize("dialog.ok_value1"),
    localize("dialog.ok_value2"),
    localize("dialog.ok_value3"),
    localize("dialog.ok_value4"),
    localize("dialog.ok_value5"),
    localize("dialog.ok_value6"),
    localize("dialog.ok_value7"),
];
let okIndex = -1;

const failedStrs = [
    localize("dialog.fail_value1"),
    localize("dialog.fail_value2"),
    localize("dialog.fail_value3"),
    localize("dialog.fail_value4"),
    localize("dialog.fail_value5"),
    localize("dialog.fail_value6"),
    localize("dialog.fail_value7"),
];
let failedIndex = -1;

export function getOK(): string {
    okIndex = (okIndex + 1) % okStrs.length;
    return okStrs[okIndex];
}

export async function msgOK(msg: string, title?: string) {
    return dialogs.alert({
        message: msg,
        okButtonText: getOK(),
        title: title ? title : localize("dialog.success"),
    });
}

export async function msgOKCancel(msg: string, ok: string, cancel: string, title?: string): Promise<boolean> {
    return dialogs.confirm({
        cancelButtonText: cancel,
        message: msg,
        okButtonText: ok,
        title: title ? title : localize("dialog.choose"),
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
        title: title ? title : localize("dialog.failure"),
    });
}
