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
import {dismissSoftKeyboard} from "~/lib/ui/users";

let NewParty: PopDesc = undefined;
let newConfig = undefined;
let page: Page = undefined;

let dataForm = fromObject({
    name: "",
    date: "",
    time: "",
    purpose: "",
    location: "",
    reward: 1e6,
});

let viewModel = fromObject({
    dataForm: dataForm,
    orgList: new ObservableArray(),
    readOnly: false,
    networkStatus: null,
});

export function onNavigatingTo(args) {
    Log.lvl1("starting config-page");
    page = <Page>args.object;
    page.bindingContext = viewModel;
    NewParty = new PopDesc("", "",
        Long.fromNumber(new Date().getTime()), "");
    if (Defaults.Testing) {
        NewParty.name = "test " + NewParty.uniqueName;
        NewParty.purpose = "testing";
        NewParty.location = "cloud";
    }
    viewModel.get("orgList").splice(0);
    viewModel.get("orgList").push(gData.contact);
    copyPartyToViewModel();
}


/**
 * Parse the date from the data form and return it as date.
 * @return {Date}
 */
function copyViewModelToParty() {
    let date = dataForm.get("date").split("-");
    let time = dataForm.get("time").split(":");

    if (date.length !== 3 || time.length !== 2) {
        return dialogs.alert({
            title: "Internal error",
            message: "Cannot parse date or time.",
            okButtonText: "Ok"
        }).then(() => {
            throw new Error("Cannot parse date or time");
        });
    }

    date.map(parseInt);
    time.map(parseInt);

    NewParty.name = dataForm.get("name");
    NewParty.location = dataForm.get("location");
    NewParty.purpose = dataForm.get("purpose");
    let unix = new Date(date[0], date[1] - 1, date[2], time[0], time[1], 0, 0).getTime();
    NewParty.dateTime = Long.fromNumber(unix);
}


function copyPartyToViewModel() {
    let date = new Date(NewParty.dateTime.toNumber());

    dataForm.set("date", sprintf("%04d-%02d-%02d", date.getFullYear(), date.getMonth() + 1, date.getDate()));
    dataForm.set("time", sprintf("%02d:%02d", date.getHours(), date.getMinutes()));
    dataForm.set("name", NewParty.name);
    dataForm.set("purpose", NewParty.purpose);
    dataForm.set("location", NewParty.location);
}

export function goBack() {
    return topmost().goBack();
}

export async function save() {
    try {
        dismissSoftKeyboard();
        setProgress("Saving", 30);
        await copyViewModelToParty();
        let orgs = viewModel.get("orgList").slice();

        // Create the party
        setProgress("Creating Party on ByzCoin", 50);
        let ppi = await gData.spawnerInstance.createPopParty(gData.coinInstance, [gData.keyIdentitySigner],
            orgs, NewParty, Long.fromNumber(dataForm.get("reward")));
        let p = new Party(ppi);
        p.isOrganizer = true;
        setProgress("Storing Parties", 75);
        await gData.addParty(p);
        setProgress();
        goBack();
    } catch (e) {
        setProgress("Error: " + e.toString(), -100);
        await msgFailed(e.toString());
        setProgress();
        Log.catch(e);
    }
}

export async function addOrg(args: any) {
    let result = await dialogs.action({
        title: "Chose organizer",
        cancelButtonText: "Abort",
        actions: gData.friends.map(f => f.alias)
    });
    let org = gData.friends.find(f => f.alias == result);
    if (org != null) {
        viewModel.get("orgList").push(org);
    }
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

