import {EventData, fromObject, fromObjectRecursive, Observable} from "tns-core-modules/data/observable";
import {Page} from "tns-core-modules/ui/page";
import {Log} from "~/lib/Log";
import {topmost} from "tns-core-modules/ui/frame";
import {gData} from "~/lib/Data";
import {msgFailed} from "~/lib/ui/messages";
import {randomBytes} from "crypto-browserify";
import {InstanceID} from "~/lib/cothority/byzcoin/ClientTransaction";

let page: Page = undefined;

let df: Observable;

let viewModel = fromObject({
    partyList: "",
    dataForm: null,
    networkStatus: "",
});

export function onNavigatingTo(args) {
    Log.lvl1("new poll");
    page = <Page>args.object;

    // Create a key-array of string to party-name, because the iid cannot be the key of the array.
    let labels = gData.badges.map(a => a)
        .sort((a, b) => a.party.uniqueName
            .localeCompare(b.party.uniqueName) * -1)
        .map(b => {
        return {
            key: b.party.partyInstance.iid.iid.toString('hex'),
            label: b.party.partyInstance.popPartyStruct.description.name
        }
    });
    viewModel.set("partyList", labels);

    // Add the object but so we can access it from within this module.
    df = fromObject({
        title: "",
        description: "",
        choices: "",
        party: labels[0].key,
    });
    viewModel.set("dataForm", df);
    page.bindingContext = viewModel;
}

export function goBack() {
    return topmost().goBack();
}

export async function save() {
    try {
        let pid = InstanceID.fromHex(df.get("party"));
        let choices = (<string>df.get("choices")).split("\n");
        choices = choices.filter(c => c.trim().length > 0);
        if (choices.length < 2) {
            return msgFailed("Please give at least two choices");
        }
        await gData.addPoll(pid, df.get("title"), df.get("description"), choices);
        goBack();
    } catch (e) {
        await msgFailed(e.toString());
        Log.catch(e);
    }
    setProgress();
}

export function setProgress(text: string = "", width: number = 0) {
    viewModel.set("networkStatus", width == 0 ? undefined : text);
    if (width != 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}

