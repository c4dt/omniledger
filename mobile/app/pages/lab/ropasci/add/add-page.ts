import {EventData, fromObject, Observable} from "tns-core-modules/data/observable";
import {Page} from "tns-core-modules/ui/page";
import Log from "~/lib/cothority/log";
import Long from "long";
import {topmost} from "tns-core-modules/ui/frame";
import {uData} from "~/user-data";
import {msgFailed} from "~/lib/messages";
import {randomBytes} from "crypto-browserify";

let page: Page = undefined;

let dataForm = fromObject({
    description: "",
    stake: 100,
    choice: "Rock",
});

let viewModel = fromObject({
    dataForm: dataForm,
    networkStatus: "",
});

export function onNavigatingTo(args) {
    Log.lvl1("new ropasci");
    page = <Page>args.object;
    dataForm.set("description", uData.contact.alias);
    page.bindingContext = viewModel;
}

export function goBack() {
    return topmost().goBack();
}

export async function save() {
    try {
        let stake = Long.fromNumber(dataForm.get("stake"));
        let choice = ["Rock", "Paper", "Scissors"].findIndex(c => c == dataForm.get("choice"));
        let fillup = randomBytes(31);
        setProgress("Creating game", 33);
        let rps = await uData.spawnerInstance.spawnRoPaSci({
            desc: dataForm.get("description"),
            coin: uData.coinInstance,
            signers: [uData.keyIdentitySigner],
            stake: stake,
            choice,
            fillup});
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
    viewModel.set("networkStatus", width == 0 ? undefined : text);
    if (width != 0) {
        let color = "#308080;";
        if (width < 0) {
            color = "#a04040";
        }
        page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
    }
}

