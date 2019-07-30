import { Party } from "~/lib/dynacred/Party";
import {ScanAttsView} from "~/pages/lab/personhood/scan-atts/scan-atts-view";
import {PopPartyInstance} from "~/lib/cothority/personhood/pop-party-instance";

import {Page} from "tns-core-modules/ui/page";
import * as dialogs from "tns-core-modules/ui/dialogs";
import {uData} from "~/user-data";
import {parseQRCode, scan} from "~/lib/dynacred/Scan";
import {msgFailed, msgOK} from "~/lib/messages";
import {topmost} from "tns-core-modules/ui/frame";

export let viewScanModel: ScanAttsView;
let party: Party = undefined;

export async function onLoaded(args) {
    const page = <Page>args.object;
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
                if (!await dialogs.confirm({
                    title: "Scanning",
                    message: "Do you want to scan another attendee?",
                    okButtonText: "Scan Next",
                    cancelButtonText: "Stop scanning",
                })) {
                    return;
                }
            } else {
                if (keys != viewScanModel.size) {
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
    try {
        viewScanModel.setProgress("Finalizing Party", 50);
        await party.partyInstance.finalize([uData.keyIdentitySigner]);
        if (party.partyInstance.popPartyStruct.state == PopPartyInstance.FINALIZED) {
            viewScanModel.setProgress("Saving Data", 75);
            await uData.save();
            viewScanModel.setProgress("Done", 100);
            await msgOK("Finalized the party");
            viewScanModel.setProgress();
        } else {
            await msgOK("Waiting for other organizers to finalize");
        }
        await goBack();
    } catch (e) {
        viewScanModel.setProgress("Error: " + e.toString(), -100);
        await msgFailed("Something went wrong: " + e.toString());
        viewScanModel.setProgress();
    }
}

export async function goBack() {
    return topmost().goBack();
}

async function addScan() {
    try {
        let result = await scan("Please scan attendee");
        let qrcode = parseQRCode(result.text, 2);
        if (qrcode.url == Party.url) {
            if (qrcode.public.length == 64) {
                await viewScanModel.addAttendee(qrcode.public);
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
    let args = await dialogs.prompt({
        title: "Public Key",
        message: "Please enter the public key of an attendee.",
        okButtonText: "Register",
        cancelButtonText: "Cancel",
        inputType: dialogs.inputType.text
    });
    if (args.result && args.text !== undefined && args.text.length == 64) {
        await viewScanModel.addAttendee(args.text);
    }
}

