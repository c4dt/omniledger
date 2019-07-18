/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData, fromObject} from "tns-core-modules/data/observable";
import {gData} from "~/lib/Data";
import {Page} from "tns-core-modules/ui/page";
import {Log} from "~/lib/Log";
import {scanNewUser, sendCoins} from "~/lib/ui/users";
import {SelectedIndexChangedEventData} from "tns-core-modules/ui/tab-view";
import {Label} from "tns-core-modules/ui/label";
import {msgFailed, msgOK} from "~/lib/ui/messages";
import {Defaults} from "~/lib/Defaults";
import {ObservableArray} from "tns-core-modules/data/observable-array";
import {Frame, topmost} from "tns-core-modules/ui/frame";
import {frame} from "~/pages/identity/identity-page";

let attributes = new ObservableArray();
let identity = fromObject({
    alias: "unknown",
    qrcode: undefined,
    coins: "0",
    networkStatus: undefined,
    testing: Defaults.TestButtons,
    passport: "default",
    attributes: attributes,
    widthAttributes: "0%",
    widthRegistered: "0%",
    widthMeetups: "0%",
    widthParty: "0%",
    personhoodScore: 0,
    hasCoins: false,
});

let page: Page;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingToHome(args: EventData) {
    Log.lvl2("navigatingTo: home");
    page = <Page>args.object;
    try {
        page.bindingContext = identity;
        setTimeout(() => update(), 1);
    } catch (e) {
        Log.catch(e);
    }
}

export function meetup() {
    return topmost().navigate({
        moduleName: "pages/home/meetup/meetup-page"
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
        moduleName: "pages/home/personhood/personhood-page"
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
    identity.set("networkStatus", width == 0 ? undefined : text);
    if (width != 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}

function setScore(att: number, reg: boolean, meet: number, party: number) {
    let attWidth = Math.floor(10 * att / 4);
    identity.set("widthAttributes", attWidth + "%");
    let regWidth = reg ? 10 : 0;
    identity.set("widthRegistered", regWidth + "%");
    let meetWidth = Math.min(meet, 6) * 5;
    identity.set("widthMeetups", meetWidth + "%");
    let partyWidth = party > 0 ? 50 : 0;
    identity.set("widthParty", partyWidth + "%");
    identity.set("personhoodScore", (attWidth + regWidth + meetWidth + partyWidth) + "%");
}

export async function update() {
    try {
        setProgress("Updating", 50);
        identity.set("hasCoins", false);
        identity.set("alias", gData.contact.alias);
        if (!gData.contact.isRegistered()) {
            await gData.contact.verifyRegistration(gData.bc);
            if (gData.contact.isRegistered()) {
                // Need to send new credential to byzcoin
                await gData.contact.sendUpdate(gData.keyIdentitySigner);
            }
            await gData.save()
        }
        identity.set("qrcode", gData.contact.qrcodeIdentity());
        attributes.splice(0);
        attributes.push({name: "alias", value: gData.contact.alias});
        if (gData.contact.email != "") {
            attributes.push({name: "email", value: gData.contact.email});
        }
        if (gData.contact.phone != "") {
            attributes.push({name: "phone", value: gData.contact.phone});
        }
        setScore(attributes.length, gData.coinInstance != null, gData.uniqueMeetings, gData.badges.length);
        if (gData.coinInstance != null) {
            identity.set("hasCoins", true);
            identity.set("init", false);
            await gData.coinInstance.update();
            identity.set("coins", gData.coinInstance.coin.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));
        }
        setProgress();
    } catch (e){
        Log.catch(e);
    }
}

export async function coins(args: EventData) {
    try {
        let u = await scanNewUser(gData);
        await sendCoins(u, setProgress);
        await update();
        await gData.save();
    } catch (e) {
        Log.catch(e);
        await msgFailed("Something unforseen happened: " + e.toString());
    }
    setProgress();
}

export async function switchHome(args: SelectedIndexChangedEventData) {
    await page.frame.navigate("pages/home/home-page");
}
