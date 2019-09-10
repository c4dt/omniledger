import { randomBytes } from "crypto-browserify";
import Long from "long";
import { fromObject } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import Log from "~/lib/cothority/log";
import { msgFailed } from "~/lib/messages";
import { uData } from "~/lib/user-data";

let page: Page;

const dataForm = fromObject({
    calypso: false,
    choice: "Rock",
    description: "",
    stake: 100,
});

const viewModel = fromObject({
    dataForm,
    networkStatus: "",
});

export function onNavigatingTo(args) {
    Log.lvl1("new ropasci");
    page = args.object as Page;
    dataForm.set("description", uData.contact.alias);
    page.bindingContext = viewModel;
}

export function goBack() {
    return topmost().goBack();
}

export async function save() {
    try {
        const stake = Long.fromNumber(dataForm.get("stake"));
        const choice = ["Rock", "Paper", "Scissors"].findIndex((c) => c === dataForm.get("choice"));
        const calypso = dataForm.get("calypso");
        const fillup = randomBytes(calypso ? 27 : 31);
        setProgress("Creating game", 33);
        const rps = await uData.spawnerInstance.spawnRoPaSci({
            calypso: calypso ? uData.lts : undefined,
            choice,
            coin: uData.coinInstance,
            desc: dataForm.get("description"),
            fillup,
            signers: [uData.keyIdentitySigner],
            stake,
        });
        setProgress("Publishing game", 66);
        await uData.addRoPaSci(rps);
        await uData.save();
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
