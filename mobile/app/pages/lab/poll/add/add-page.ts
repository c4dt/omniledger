// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { fromObject, Observable } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed } from "~/lib/messages";

let page: Page;

let df: Observable;

const viewModel = fromObject({
    dataForm: null,
    networkStatus: "",
    partyList: "",
});

export function onNavigatingTo(args) {
    Log.lvl1("new poll");
    page = args.object as Page;

    // Create a key-array of string to party-name, because the iid cannot be the key of the array.
    const labels = uData.badges.slice()
        .sort((a, b) => a.party.uniqueName
            .localeCompare(b.party.uniqueName) * -1)
        .map((b) => {
        return {
            key: b.party.partyInstance.id.toString("hex"),
            label: b.party.partyInstance.popPartyStruct.description.name,
        };
    });
    labels.unshift({key: Buffer.alloc(32).toString("hex"), label: "all"});
    viewModel.set("partyList", labels);

    // Add the object but so we can access it from within this module.
    df = fromObject({
        choices: "",
        description: "",
        party: labels[0].key,
        title: "",
    });
    viewModel.set("dataForm", df);
    page.bindingContext = viewModel;
}

export function goBack() {
    return topmost().goBack();
}

export async function save() {
    try {
        const pid = Buffer.from(df.get("party"), "hex");
        const [choicesRaw, title, desc] = [df.get("choices").toString().split("\n"), df.get("title").toString(),
            df.get("description").toString()];
        const choices = choicesRaw.filter((c) => c.trim().length > 0);
        if (choices.length < 2) {
            return msgFailed("Please give at least two choices");
        }
        if (title.length === 0 || desc.length === 0) {
            return msgFailed("Title and description need to contain something.");
        }
        await uData.addPoll(pid, title, desc, choices);
        goBack();
    } catch (e) {
        await msgFailed(e.toString());
        Log.catch(e);
    }
    setProgress();
}

export function setProgress(text: string = "", width: number = 0) {
    viewModel.set("networkStatus", width === 0 ? undefined : text);
    if (width !== 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}
