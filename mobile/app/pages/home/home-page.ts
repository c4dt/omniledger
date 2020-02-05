// tslint:disable-next-line
require("nativescript-nodeify");

import { TProgress } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import Long from "long";
import { localize } from "nativescript-localize";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";
import { bcDef, finishData, isAdmin, uData, updateIsAdmin } from "~/lib/byzcoin-def";
import { coinToPoplet, msgFailed, msgOK, msgOKCancel } from "~/lib/messages";
import { getRawData, IScore, rawToPercent } from "~/lib/personhood";
import { qrcodeIdentity } from "~/lib/qrcode";
import { scanNewUser } from "~/lib/users";
import { ModalProgress } from "~/pages/modal/modal-progress";
import { UserView } from "../identity/contacts/contacts-view";

const attributes = new ObservableArray();
const identity = fromObject({
    alias: "unknown",
    attributes,
    coins: "0",
    hasCoins: false,
    isAdmin: false,
    networkStatus: undefined,
    passport: "default",
    personhoodScore: 0,
    qrcode: undefined,
    testing: bcDef.testingMode,
    widthAttributes: "0%",
    widthMeetups: "0%",
    widthParty: "0%",
    widthPolls: "0%",
    widthRPS: "0%",
    widthReferences: "0%",
    widthRegistered: "0%",
});

let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingToHome(args: EventData) {
    Log.lvl2("navigatingTo: home");
    page = args.object as Page;
    page.bindingContext = identity;
    try {
        setTimeout(() => update(), 1);
    } catch (e) {
        Log.catch(e);
    }
}

export function meetup() {
    return topmost().navigate({
        moduleName: "pages/home/meetup/meetup-page",
    });
}

export function login() {
    return msgOK("Scanning QRCode of login page");
}

export function twoFA() {
    return msgOK("The 2-factor authentication code is: 123 456");
}

let identityShow = 0;

export function personhoodDesc() {
    return topmost().navigate({
        moduleName: "pages/home/personhood/personhood-page",
    });
}

export function cyclePersonhood() {
    const score: IScore = {
        attributes: 0, invites: 0, meetups: 0, parties: 0,
        polls: 0, registered: 0, roPaScis: 0, snack: 0,
    };
    for (let i = 0; i <= identityShow; i++) {
        switch (i) {
            case 0:
                score.attributes = 4;
                score.snack = 1;
                break;
            case 1:
                score.registered = 1;
                break;
            case 2:
                score.meetups = 3;
                break;
            case 3:
                score.parties = 2;
                break;
            case 4:
                score.roPaScis = 5;
                break;
            case 5:
                score.polls = 3;
                break;
            case 6:
                score.invites = 5;
                identityShow = -1;
                break;
        }
    }
    setScore(score);
    identityShow++;
}

export function setProgressLocal(width: number = 0, text: string = "") {
    identity.set("networkStatus", width === 0 ? undefined : text);
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) +
            "%; background-color: " + color);
    }
}

function setScore(s: IScore) {
    const scores = rawToPercent(s);

    identity.set("widthAttributes", scores.attributes + "%");
    identity.set("widthRegistered", scores.registered + "%");
    identity.set("widthMeetups", scores.meetups + "%");
    identity.set("widthParty", scores.parties + "%");
    identity.set("widthRPS", scores.roPaScis + "%");
    identity.set("widthPolls", scores.polls + "%");
    identity.set("widthSnack", scores.snack + "%");
    identity.set("widthReferences", scores.invites + "%");
    // Total score
    identity.set("personhoodScore", Object.values(scores).reduce((a, b) => a + b) + "%");
}

export async function update() {
    setProgressLocal(50, localize("progress.updating"));
    identity.set("hasCoins", false);
    identity.set("alias", uData.contact.alias);
    if (!uData.contact.isRegistered() && await uData.contact.isRegisteredByzCoin(uData.bc)) {
        Log.print("activating profile");
        try {
            await finishData();
            await uData.connectByzcoin();
        } catch (e) {
            await msgFailed("Error while trying to activate your profile: " + e.toString());
        }
    }
    identity.set("qrcode", qrcodeIdentity(uData.contact));
    attributes.splice(0);
    attributes.push({name: "alias", value: uData.contact.alias});
    if (uData.contact.email !== "") {
        attributes.push({name: "email", value: uData.contact.email});
    }
    if (uData.contact.phone !== "") {
        attributes.push({name: "phone", value: uData.contact.phone});
    }
    setScore(getRawData(uData));
    if (uData.coinInstance != null) {
        identity.set("hasCoins", true);
        identity.set("init", false);
        await uData.coinInstance.update();
        identity.set("coins", coinToPoplet(uData.coinInstance.value));
    }
    await updateIsAdmin();
    identity.set("isAdmin", isAdmin);
    setProgressLocal();
}

export async function invite(args: EventData) {
    const u = await scanNewUser(uData);
    await ModalProgress.show(async (setProgress: TProgress) => {
        await UserView.inviteUser(u, setProgress);
    });
    await update();
}

export async function paySnack() {
    if (uData.coinInstance.value.lessThan(Long.fromNumber(6e5))) {
        return msgFailed(localize("home.nosnack"));
    }
    if (!(await msgOKCancel(localize("home.snack"), localize("home.pay"), localize("home.cancel")))) {
        return;
    }
    await ModalProgress.show(async (setProgress: TProgress) => {
        setProgress(33, localize("home.scanning"));
        const u = await scanNewUser(uData);
        setProgress(50, localize("home.check_admin"));
        if (u.personhoodPub == null) {
            throw new Error(localize("home.no_admin"));
        }
        setProgress(66, localize("home.send_coins"));
        await uData.coinInstance.transfer(Long.fromNumber(6e5), u.coinID, [uData.keyIdentitySigner]);
        uData.contact.hasSnack = true;
        await uData.save();
        setProgress(100, "Done");
        await msgOK(localize("home.snack_paid"));
    });
    return update();
}

export async function switchHome(args: SelectedIndexChangedEventData) {
    if (page) {
        await update();
    }
}
