import {EventData, fromObject, Observable} from "tns-core-modules/data/observable";
import {Page} from "tns-core-modules/ui/page";
import {Log} from "~/lib/Log";
import * as dialogs from "tns-core-modules/ui/dialogs";
import * as Long from "long";
import {ObservableArray} from "tns-core-modules/data/observable-array";
import {topmost} from "tns-core-modules/ui/frame";
import {PopDesc, PopPartyStruct} from "~/lib/cothority/byzcoin/contracts/PopPartyInstance";
import {gData} from "~/lib/Data";
import {Party} from "~/lib/Party";
import {IdentityEd25519} from "~/lib/cothority/darc/IdentityEd25519";
import {Defaults} from "~/lib/Defaults";
import {sprintf} from "sprintf-js";
import {CredentialInstance} from "~/lib/cothority/byzcoin/contracts/CredentialInstance";
import {msgFailed} from "~/lib/ui/messages";
import {Contact} from "~/lib/Contact";
import {randomBytes} from "crypto-browserify";
import {elRoPaSci} from "~/pages/lab/ropasci/ropasci-page";
import {Label} from "tns-core-modules/ui/label";

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
    dataForm.set("description", gData.contact.alias);
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
        let rps = await gData.spawnerInstance.createRoPaSci(dataForm.get("description"), gData.coinInstance,
            gData.keyIdentitySigner, stake, choice, fillup);
        setProgress("Publishing game", 66);
        await gData.addRoPaSci(rps);
        await gData.save();
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

