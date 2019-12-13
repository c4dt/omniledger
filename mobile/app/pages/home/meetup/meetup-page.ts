// tslint:disable-next-line
require("nativescript-nodeify");

import { Contact, TProgress } from "@c4dt/dynacred";
import { Meetup, SocialNode } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { EventData } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed } from "~/lib/messages";
import { MeetupView } from "~/pages/home/meetup/meetup-view";
import { ModalProgress } from "~/pages/modal/modal-progress";

let identity: MeetupView;
let page: Page;
let interval: any;
let counter: number;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    identity = new MeetupView();
    page = args.object as Page;
    page.bindingContext = identity;
    setProgressLocal("Broadcasting position", 30);
    try {
        const userLocation = uData.contact.toUserLocation();
        await uData.phrpc.meetups(new Meetup({userLocation}));
        await meetupUpdate();
        if (interval) {
            clearInterval(interval);
        }
        counter = 0;
        interval = setInterval(async () => {
            await meetupUpdate();
            counter++;
            if (counter >= 12) {
                clearInterval(interval);
            }
        }, 5000);
    } catch (e) {
        Log.error(e);
    }
}

export async function meetupUpdate() {
    setProgressLocal("Listening for other broadcasts", 60);
    const ms = await uData.phrpc.listMeetups();
    identity.updateUsers(ms);
    setProgressLocal();
}

export async function addContacts() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
    if (identity.users.length === 0) {
        await msgFailed("Need at least one other attendee to have a meetup", "Empty Meetup");
    } else {
        await ModalProgress.show(async (setProgress: TProgress) => {
            setProgress(10, "Fetching all contacts");
            uData.meetups.push(new SocialNode(identity.users));
            let perc = 20;
            for (const user of identity.users) {
                setProgress(perc, "Fetching " + user.alias);
                perc += 70 / identity.users.length;
                uData.addContact(await Contact.fromUserLocation(uData.bc, user));
            }
            setProgress(90, "Saving");
            await uData.save();
        });
    }
    topmost().goBack();
}

export function setProgressLocal(text: string = "", width: number = 0) {
    identity.set("networkStatus", width === 0 ? undefined : text);
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}
