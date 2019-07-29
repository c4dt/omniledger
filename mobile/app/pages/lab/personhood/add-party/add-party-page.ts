import Long from "long";
import Moment from "moment";
import { sprintf } from "sprintf-js";
import { fromObject } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import Log from "~/lib/cothority/log";
import { PopDesc } from "~/lib/cothority/personhood/proto";
import { Defaults } from "~/lib/dynacred/Defaults";
import { Party } from "~/lib/dynacred/Party";
import { msgFailed } from "~/lib/messages";
import { dismissSoftKeyboard } from "~/lib/users";
import { uData } from "~/user-data";

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
    try {
        Log.lvl1("starting config-page");
        page = <Page> args.object;
        page.bindingContext = viewModel;
        if (Defaults.Testing) {
            NewParty = new PopDesc({
                name: "test " + Moment(new Date()).format("YY-MM-DD HH:mm"), purpose: "testing",
                datetime: Long.fromNumber(new Date().getTime()), location: "cloud"
            });
        } else {
            NewParty = new PopDesc({
                name: "", purpose: "",
                datetime: Long.fromNumber(new Date().getTime()), location: ""
            });
        }
        viewModel.get("orgList").splice(0);
        viewModel.get("orgList").push(uData.contact);
        copyPartyToViewModel();
    } catch (e) {
        Log.catch(e);
    }
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

    let unix = new Date(date[0], date[1] - 1, date[2], time[0], time[1], 0, 0).getTime();
    NewParty = new PopDesc({
        name: dataForm.get("name"), purpose: dataForm.get("purpose"),
        datetime: Long.fromNumber(unix), location: dataForm.get("location")
    });
}

function copyPartyToViewModel() {
    let date = new Date(NewParty.datetime.toNumber());

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
        let ppi = await uData.spawnerInstance.spawnPopParty({
            coin: uData.coinInstance, signers: [uData.keyIdentitySigner],
            orgs: orgs, desc: NewParty, reward: Long.fromNumber(dataForm.get("reward"))
        });
        let p = new Party(ppi);
        p.isOrganizer = true;
        setProgress("Storing Parties", 75);
        await uData.addParty(p);
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
        actions: uData.contacts.map(f => f.alias)
    });
    let org = uData.contacts.find(f => f.alias == result);
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

