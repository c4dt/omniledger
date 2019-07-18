/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

import {EventData, fromObject} from "tns-core-modules/data/observable";
import {gData} from "~/lib/Data";
import {Page} from "tns-core-modules/ui/page";
import {Log} from "~/lib/Log";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {GestureEventData} from "tns-core-modules/ui/gestures";
import {Contact} from "~/lib/Contact";
import * as Long from "long";
import {assertRegistered, scanNewUser} from "~/lib/ui/users";
import {ObservableArray} from "tns-core-modules/data/observable-array";
import {ItemEventData} from "tns-core-modules/ui/list-view";
import {ContactsView} from "~/pages/identity/contacts/contacts-view";
import {Label} from "tns-core-modules/ui/label";
import {Meetup, PersonhoodRPC, UserLocation} from "~/lib/PersonhoodRPC";
import {MeetupView} from "~/pages/home/meetup/meetup-view";
import {topmost} from "tns-core-modules/ui/frame";
import {SocialNode} from "~/lib/SocialNode";
import {msgFailed} from "~/lib/ui/messages";
import Timeout = NodeJS.Timeout;

let identity: MeetupView;
let page: Page;
let phrpc: PersonhoodRPC;
let interval: Timeout;
let counter: number;

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    identity = new MeetupView();
    page = <Page>args.object;
    page.bindingContext = identity;
    phrpc = new PersonhoodRPC(gData.bc);
    setProgress("Broadcasting position", 30);
    try {
        let ul = UserLocation.fromContact(gData.contact);
        await phrpc.meetups(new Meetup(ul));
        await meetupUpdate();
        if (interval){
            clearInterval(interval);
        }
        counter = 0;
        interval = setInterval(() => {
            meetupUpdate();
            counter++;
            if (counter >= 12){
                clearInterval(interval);
            }
        }, 5000);
    } catch (e){
        Log.error(e);
    }
}

export async function meetupUpdate() {
    setProgress("Listening for other broadcasts", 60);
    let ms = await phrpc.listMeetups();
    identity.updateUsers(ms);
    setProgress();
}

export async function addContacts(){
    clearInterval(interval);
    interval = null;
    if (identity.users.length == 0){
        await msgFailed("Need at least one other attendee to count meetup", "Empty Meetup");
    } else {
        gData.meetups.push(new SocialNode(identity.users));
        for (let i = 0; i < identity.users.length; i++) {
            gData.addContact(await identity.users[i].toContact(gData.bc));
            Log.print("updating")
        }
        await gData.save();
    }
    topmost().goBack();
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
