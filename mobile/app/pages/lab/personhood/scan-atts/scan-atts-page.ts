// tslint:disable-next-line
require("nativescript-nodeify");

import { localize } from "nativescript-localize";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { ModalProgress } from "~/pages/modal/modal-progress";

import { PartyItem, TProgress } from "@c4dt/dynacred";
import { PopPartyInstance } from "@dedis/cothority/personhood/pop-party-instance";
import { Page } from "tns-core-modules/ui/page";
import URL from "url-parse";
import { uData } from "~/lib/byzcoin-def";
import { msgFailed, msgOK } from "~/lib/messages";
import { scan } from "~/lib/scan";
import { ScanAttsView } from "~/pages/lab/personhood/scan-atts/scan-atts-view";

export let viewScanModel: ScanAttsView;
let party: PartyItem;

export async function onLoaded(args) {
    const page = args.object as Page;
    party = page.navigationContext;
    viewScanModel = new ScanAttsView(party);
    page.bindingContext = viewScanModel;
}

export async function addNewKey() {
    try {
        let keys = viewScanModel.size;
        while (true) {
            await addScan();
            if (!uData.continuousScan) {
                // tslint:disable:object-literal-sort-keys
                if (!await dialogs.confirm({
                    title: "Scanning",
                    message: "Do you want to scan another attendee?",
                    okButtonText: "Scan Next",
                    cancelButtonText: "Stop scanning",
                    // tslint:enable:object-literal-sort-keys
                })) {
                    return;
                }
            } else {
                if (keys !== viewScanModel.size) {
                    keys++;
                } else {
                    return;
                }
            }
        }
    } catch (e) {
        await msgFailed("Something went wrong: " + e.toString());
    }
}

/**
 * Function called when the button "finalize" is clicked. It starts the registration process with the organizers conode.
 * @returns {Promise.<any>}
 */
export async function finalize() {
    await ModalProgress.show(async (setProgress: TProgress) => {
        setProgress(50, localize("scan_atts.finalizing"));
        await party.partyInstance.finalize([uData.keyIdentitySigner]);
        setProgress(75, localize("progress.saving"));
        await uData.save();
    });
    if (party.partyInstance.popPartyStruct.state === PopPartyInstance.FINALIZED) {
        await msgOK("Finalized the party");
        viewScanModel.setProgress();
    } else {
        await msgOK("Waiting for other organizers to finalize");
    }
    await goBack();
}

export async function goBack() {
    return topmost().goBack();
}

async function addScan() {
    try {
        const result = await scan("Please scan attendee");
        const resURL = new URL(result.text, true);
        if (resURL.origin + resURL.pathname === PartyItem.url) {
            const pub = resURL.query.public;
            if (pub && pub.length === 64) {
                await viewScanModel.addAttendee(pub);
            } else {
                await msgFailed("Got wrong public key");
            }
        } else {
            await msgFailed("This is not a party");
        }
    } catch (e) {
        await addManual();
    }
}

async function addManual() {
    // tslint:disable:object-literal-sort-keys
    const args = await dialogs.prompt({
        title: "Public Key",
        message: "Please enter the public key of an attendee.",
        okButtonText: "Register",
        cancelButtonText: "Cancel",
        inputType: dialogs.inputType.text,
        // tslint:enable:object-literal-sort-keys
    });
    if (args.result && args.text !== undefined && args.text.length === 64) {
        await viewScanModel.addAttendee(args.text);
    }
}
