/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import { EventData } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import Log from "~/lib/cothority/log";
import { Contact } from "~/lib/dynacred";
import { Meetup } from "~/lib/dynacred/personhood-rpc";
import { SocialNode } from "~/lib/dynacred/SocialNode";
import { msgFailed } from "~/lib/messages";
import { uData } from "~/lib/user-data";
import { MeetupView } from "~/pages/home/meetup/meetup-view";

let identity: MeetupView;
let page: Page;
let interval: any;
let counter: number;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    identity = new MeetupView();
    page = args.object as Page;
    page.bindingContext = identity;
    setProgress("Broadcasting position", 30);
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
    setProgress("Listening for other broadcasts", 60);
    const ms = await uData.phrpc.listMeetups();
    identity.updateUsers(ms);
    setProgress();
}

export async function addContacts() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
    if (identity.users.length === 0) {
        await msgFailed("Need at least one other attendee to have a meetup", "Empty Meetup");
    } else {
        try {
            setProgress("Fetching all contacts", 10);
            uData.meetups.push(new SocialNode(identity.users));
            let perc = 20;
            for (const user of identity.users) {
                setProgress("Fetching " + user.alias, perc);
                perc += 70 / identity.users.length;
                uData.addContact(await Contact.fromUserLocation(uData.bc, user));
            }
            setProgress("Saving", 90);
            await uData.save();
            setProgress("Done", 100);
        } catch (e) {
            Log.catch(e);
            setProgress(e.toString(), -100);
            await msgFailed("Couldn't add contacts from meetup: " + e.toString());
        }
        setProgress();
    }
    topmost().goBack();
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
