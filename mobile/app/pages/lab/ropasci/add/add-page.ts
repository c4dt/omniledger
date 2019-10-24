import { randomBytes } from "crypto-browserify";
import Long from "long";
import { localize } from "nativescript-localize";
import { fromObject } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import Log from "~/lib/cothority/log";
import { msgFailed, msgOK, msgOKCancel, popletToCoin } from "~/lib/messages";
import { isAdmin, uData } from "~/lib/user-data";

let page: Page;

const dataForm = fromObject({
    calypso: true,
    choice: "Rock",
    description: "",
    stake: "1",
});

const viewModel = fromObject({
    dataForm,
    isAdmin,
    networkStatus: "",
    rpsValues: [
        {key: "Rock", label: localize("ropascis.rock")},
        {key: "Paper", label: localize("ropascis.paper")},
        {key: "Scissors", label: localize("ropascis.scissors")},
    ],
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
        const stake = popletToCoin(dataForm.get("stake"));
        const choice = ["Rock", "Paper", "Scissors"].findIndex((c) => c === dataForm.get("choice"));
        let calypso = dataForm.get("calypso");
        if (!calypso) {
            if (!(await msgOKCancel(localize("ropascis.no_calypso"),
                                    localize("dialog.yes"),
                                    localize("ropascis.use_calypso")))) {
                calypso = true;
            }
        }
        const fillup = Buffer.from(randomBytes(31));
        if (calypso) {
            // Calypso rps can only use 27 fillup bytes, but we need to give 31 anyway. So fill the
            // last 4 bytes with 0s, so that player 2 can know them. 27*8 bits should be enough for
            // everybody...
            fillup.fill(0, 27, 31);
        }
        setProgress(localize("ropascis.creating"), 33);
        const rps = await uData.spawnerInstance.spawnRoPaSci({
            calypso: calypso ? uData.lts : undefined,
            choice,
            coin: uData.coinInstance,
            desc: dataForm.get("description"),
            fillup,
            signers: [uData.keyIdentitySigner],
            stake,
        });
        setProgress(localize("ropascis.publishing"), 66);
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
