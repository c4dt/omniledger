import { sprintf } from "sprintf-js";
import { fromObject } from "tns-core-modules/data/observable";
import { EventData, Page, topmost } from "tns-core-modules/ui/frame";
import Log from "~/lib/cothority/log";
import { getMax, getRawData } from "~/lib/personhood";
import { uData } from "~/lib/user-data";

let page: Page;
const rundown = fromObject({});

export async function navigatingTo(args: EventData) {
    Log.lvl2("navigatingTo: home");
    page = args.object as Page;
    const max = getMax();
    try {
        const count = getRawData(uData);
        addRundown(count.attributes, max.attributes, "attributes",
            "Add more information to your identity.", "Well done.");
        addRundown(count.registered, max.registered, "registrations",
            "Get yourself registered on the blockchain by somebody who has some coins, or visit a personhood party.",
            "Nice. Enjoy staying on the blockchain!");
        addRundown(count.meetups, max.meetups, "meetups",
            "Meet some people and exchange contacts. Only unique meeting groups are counted.",
            "Keep up meeting other participants");
        addRundown(count.parties, max.parties, "parties",
            "Go to a personhood party and get your public key registered.",
            "Nice party-goer!");
        addRundown(count.roPaScis, max.roPaScis, "ropascis",
            "Play some rock-paper-scissor games.",
            "Good gamer!");
        addRundown(count.polls, max.polls, "polls",
            "Answer polls to raise your score.",
            "Fervent poller!");
        addRundown(count.invites, max.invites, "invites",
            "Invite and sign up new players.",
            "Good inviter!");
        page.bindingContext = rundown;
    } catch (e) {
        Log.catch(e);
    }
}

function addRundown(now: number, max: number, attribute: string, improve: string, done: string) {
    const label = attribute + "_rundown";
    let text = sprintf("You got all %d %s. %s", max, attribute, done);
    if (now < max) {
        text = sprintf("You got %d out of %d %s. %s", now, max, attribute, improve);
        rundown.set(label + "_label", "\uf05a  ");
    } else {
        rundown.set(label + "_label", "\uf058  ");
    }
    rundown.set(label, text);
}

export async function goBack() {
    return topmost().goBack();
}
