/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData, fromObject } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { getFrameById, topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { SelectedIndexChangedEventData, TabView } from "tns-core-modules/ui/tab-view";
import Log from "~/lib/cothority/log";
import { msgFailed, msgOK } from "~/lib/messages";
import { qrcodeIdentity } from "~/lib/qrcode";
import { testingMode, uData } from "~/lib/user-data";
import { scanNewUser } from "~/lib/users";
import { frame } from "~/pages/identity/identity-page";
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
    widthRegistered: "0%",
});

let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingToHome(args: EventData) {
    Log.lvl2("navigatingTo: home");
    page = args.object as Page;
    page.bindingContext = identity;
    if (!uData) {
        Log.lvl2("uData not yet ready");
        return;
    }
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
    switch (identityShow) {
        case 0:
            setScore(4, false, 0, 0);
            break;
        case 1:
            setScore(4, true, 0, 0);
            break;
        case 2:
            setScore(4, true, 6, 0);
            break;
        case 4:
            setScore(4, true, 6, 1);
            break;
        case 4:
            setScore(0, false, 0, 0);
            identityShow = -1;
            break;
    }
    identityShow++;
}

export function setProgress(text: string = "", width: number = 0) {
    identity.set("networkStatus", width === 0 ? undefined : text);
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}

function setScore(att: number, reg: boolean, meet: number, party: number) {
    const attWidth = Math.floor(10 * att / 4);
    identity.set("widthAttributes", attWidth + "%");
    const regWidth = reg ? 10 : 0;
    identity.set("widthRegistered", regWidth + "%");
    const meetWidth = Math.min(meet, 6) * 5;
    identity.set("widthMeetups", meetWidth + "%");
    const partyWidth = party > 0 ? 50 : 0;
    identity.set("widthParty", partyWidth + "%");
    identity.set("personhoodScore", (attWidth + regWidth + meetWidth + partyWidth) + "%");
}

export async function update() {
    try {
        setProgress("Updating", 50);
        identity.set("hasCoins", false);
        identity.set("alias", uData.contact.alias);
        if (!uData.contact.isRegistered() && await uData.contact.isRegisteredByzCoin(uData.bc)) {
            try {
                await uData.contact.updateOrConnect(uData.bc);
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
        setScore(attributes.length, uData.coinInstance != null, uData.uniqueMeetings, uData.badges.length);
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
        const u = await scanNewUser(uData);
        await UserView.payUser(u, setProgress);
        await update();
        await uData.save();
    } catch (e) {
        Log.catch(e);
        await msgFailed("Something unforseen happened: " + e.toString());
    }
    setProgress();
}

export async function switchHome(args: SelectedIndexChangedEventData) {
    // This is only done for the "switchHome", not for the other "switch*", as "switchHome" is
    // used as an entry-point by different code-paths to go from the "loading/setup"-view to the
    // tab-view.
    // let tv = <TabView> getFrameById("app-root").getViewById("mainTabView");
    // tv.selectedIndex = 0;
}
