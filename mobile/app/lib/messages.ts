import * as dialogs from "tns-core-modules/ui/dialogs";

let okStrs = ['Cool', 'Nice', 'This rocks', 'Wonderful', 'Fantastic', 'Best', ':stars:'];
let okIndex = -1;

let failedStrs = ['Too bad', 'Shame', 'Try later', 'Dang', 'Why?', "Life's hard", 'This sucks'];
let failedIndex = -1;

export function getOK(): string {
    okIndex = (okIndex + 1) % okStrs.length;
    return okStrs[okIndex];
}

export async function msgOK(msg: string, title?: string){
    return dialogs.alert({
        title: title ? title : "Success",
        message: msg,
        okButtonText: getOK(),
    })
}

export function getFailed(): string {
    failedIndex = (failedIndex + 1) % failedStrs.length;
    return failedStrs[failedIndex];
}

export async function msgFailed(msg: string, title?: string){
    return dialogs.alert({
        title: title ? title : "Failure",
        message: msg,
        okButtonText: getFailed(),
    })
}

