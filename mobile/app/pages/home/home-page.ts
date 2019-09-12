/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData, fromObject } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { SelectedIndexChangedEventData } from "tns-core-modules/ui/tab-view";
import Log from "~/lib/cothority/log";
import { msgFailed, msgOK } from "~/lib/messages";
import { getRawData, IScore, rawToPercent } from "~/lib/personhood";
import { qrcodeIdentity } from "~/lib/qrcode";
import { testingMode, uData } from "~/lib/user-data";
import { scanNewUser } from "~/lib/users";
import { UserView } from "../identity/contacts/contacts-view";

const attributes = new ObservableArray();
const identity = fromObject({
    alias: "unknown",
    attributes,
    coins: "0",
    hasCoins: false,
    networkStatus: undefined,
    passport: "default",
    personhoodScore: 0,
    qrcode: undefined,
    testing: testingMode,
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
        polls: 0, registered: 0, roPaScis: 0,
    };
    for (let i = 0; i <= identityShow; i++) {
        switch (i) {
            case 0:
                score.attributes = 4;
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

export function setProgress(text: string = "", width: number = 0) {
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
    identity.set("widthReferences", scores.invites + "%");
    // Total score
    identity.set("personhoodScore", Object.values(scores).reduce((a, b) => a + b) + "%");
}

export async function update() {
    try {
        setProgress("Updating", 50);
        identity.set("hasCoins", false);
        identity.set("alias", uData.contact.alias);
        if (!uData.contact.isRegistered() && await uData.contact.isRegisteredByzCoin(uData.bc)) {
            try {
                await uData.connectByzcoin();
                if (uData.contact.isRegistered()) {
                    // Need to send new credential to byzcoin
                    await uData.contact.sendUpdate([uData.keyIdentitySigner]);
                }
                await uData.save();
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
            identity.set("coins", uData.coinInstance.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));
        }
        setProgress();
    } catch (e) {
        Log.catch(e);
    }
}

export async function coins(args: EventData) {
    try {
        setProgress("Scanning new user", 1);
        const u = await scanNewUser(uData);
        setProgress("Updating contact list", 10);
        await uData.addContact(u);
        await uData.save();
        await UserView.inviteUser(u, setProgress);
        await update();
        await uData.save();
    } catch (e) {
        Log.catch(e);
        await msgFailed("Something unforseen happened: " + e.toString());
    }
    setProgress();
}

export async function switchHome(args: SelectedIndexChangedEventData) {
    if (page) {
        await update();
    }
}
