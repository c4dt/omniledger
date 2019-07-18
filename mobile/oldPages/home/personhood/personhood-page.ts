import {EventData, Page, topmost} from "tns-core-modules/ui/frame";
import {Log} from "~/lib/Log";
import {fromObject} from "tns-core-modules/data/observable";
import {sprintf} from "sprintf-js";
import {gData} from "~/lib/Data";

let page: Page;
let rundown = fromObject({});

export async function navigatingTo(args: EventData) {
    Log.lvl2("navigatingTo: home");
    page = <Page>args.object;
    try {
        let atts = 1;
        atts += gData.contact.email != "" ? 1 : 0;
        atts += gData.contact.phone != "" ? 1 : 0;
        atts += gData.contact.url != "" ? 1 : 0;
        addRundown(atts, 4, "attributes",
            "Add more information to your identity.", "Well done.");
        addRundown(gData.coinInstance != null ? 1 : 0, 1, "registrations",
            "Get yourself registered on the blockchain by somebody who has some coins, or visit a personhood party.",
            "Nice. Enjoy staying on the blockchain!");
        addRundown(gData.uniqueMeetings, 6, "meetups",
            "Meet some people and exchange contacts. Only unique meeting groups are counted.",
            "Keep up meeting other participants");
        addRundown(gData.badges.length, 1, "parties",
            "Go to a personhood party and get your public key registered.",
            "Nice party-goer!");
        page.bindingContext = rundown;
    } catch (e) {
        Log.catch(e);
    }
}

function addRundown(now: number, max: number, attribute: string, improve: string, done: string) {
    let label = attribute + "_rundown";
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
