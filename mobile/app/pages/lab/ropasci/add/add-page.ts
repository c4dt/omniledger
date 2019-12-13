// tslint:disable-next-line
require("nativescript-nodeify");

import { TProgress } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { randomBytes } from "crypto-browserify";
import { localize } from "nativescript-localize";
import { fromObject } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { isAdmin, uData } from "~/lib/byzcoin-def";
import { msgOKCancel, popletToCoin } from "~/lib/messages";
import { ModalProgress } from "~/pages/modal/modal-progress";

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
    let calypso = dataForm.get("calypso");
    if (!calypso) {
        if (!(await msgOKCancel(localize("ropascis.no_calypso"),
            localize("dialog.yes"),
            localize("ropascis.use_calypso")))) {
            calypso = true;
        }
    }

    await ModalProgress.show(async (setProgress: TProgress) => {
        const stake = popletToCoin(dataForm.get("stake"));
        const choice = ["Rock", "Paper", "Scissors"].findIndex((c) => c === dataForm.get("choice"));
        const fillup = Buffer.from(randomBytes(31));
        if (calypso) {
            // Calypso rps can only use 27 fillup bytes, but we need to give 31 anyway. So fill the
            // last 4 bytes with 0s, so that player 2 can know them. 27*8 bits should be enough for
            // everybody...
            fillup.fill(0, 27, 31);
        }
        setProgress(33, localize("ropascis.creating"));
        const rps = await uData.spawnerInstance.spawnRoPaSci({
            calypso: calypso ? uData.lts : undefined,
            choice,
            coin: uData.coinInstance,
            desc: dataForm.get("description"),
            fillup,
            signers: [uData.keyIdentitySigner],
            stake,
        });
        setProgress(66, localize("ropascis.publishing"));
        await uData.addRoPaSci(rps);
        await uData.save();
    });
    goBack();
}
