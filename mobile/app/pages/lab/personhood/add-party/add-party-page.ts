// tslint:disable-next-line
require("nativescript-nodeify");

import { Contact, PartyItem, TProgress } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { PopDesc } from "@dedis/cothority/personhood/proto";
import Long from "long";
import Moment from "moment";
import { localize } from "nativescript-localize";
import { sprintf } from "sprintf-js";
import { EventData, fromObject } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { Page } from "tns-core-modules/ui/page";
import { bcDef, uData } from "~/lib/byzcoin-def";
import { dismissSoftKeyboard } from "~/lib/users";
import { ModalProgress } from "~/pages/modal/modal-progress";

let newParty: PopDesc;
let page: Page;

let orgList = [];

const dataForm = {
    date: "",
    location: "",
    name: "",
    purpose: "",
    reward: 1e6,
    time: "",
};

const viewModel = fromObject({
    dataForm,
    networkStatus: null,
    orgList,
});

export function onNavigatingTo(args: EventData) {
    Log.lvl1("addPartyPage");

    try {
        page = args.object as Page;
        page.bindingContext = viewModel;
        if (bcDef.testingMode) {
            newParty = new PopDesc({
                datetime: Long.fromNumber(new Date().getTime()),
                location: "cloud",
                name: "test " + Moment(new Date()).format("YY-MM-DD HH:mm"),
                purpose: "testing",
            });
        } else {
            newParty = new PopDesc({
                datetime: Long.fromNumber(new Date().getTime()),
                location: "",
                name: "",
                purpose: "",
            });
        }
        orgList = [uData.contact];
        updateModel();
        copyPartyToViewModel();
    } catch (e) {
        Log.catch(e);
    }
}

// updateModel sets new data to the viewModel. The RadDataViewer under iOS doesn't
// recognize new data when it points to the same object, so the viewModel.set method
// needs to take a copoy of the data.
function updateModel() {
    viewModel.set("dataForm", dataForm);
    viewModel.set("orgList", orgList.slice());
}

/**
 * Parse the date from the data form and return it as date.
 * @return {Date}
 */
function copyViewModelToParty() {
    const df = viewModel.get("dataForm");
    const date = df.date.split("-").map((n) => parseInt(n, 10));
    const time = df.time.split(":").map((n) => parseInt(n, 10));

    if (date.length !== 3 || time.length !== 2) {
        // tslint:disable:object-literal-sort-keys
        return dialogs.alert({
            title: "Internal error",
            message: "Cannot parse date or time.",
            okButtonText: "Ok",
        }).then(() => {
            throw new Error("Cannot parse date or time");
        });
        // tslint:enable:object-literal-sort-keys
    }

    const unix = new Date(date[0], date[1] - 1, date[2], time[0], time[1], 0, 0).getTime();
    newParty = new PopDesc({
        datetime: Long.fromNumber(unix),
        location: df.location,
        name: df.name,
        purpose: df.purpose,
    });
}

function copyPartyToViewModel() {
    const date = new Date(newParty.datetime.toNumber());
    dataForm.date = sprintf("%04d-%02d-%02d", date.getFullYear(), date.getMonth() + 1, date.getDate());
    dataForm.time = sprintf("%02d:%02d", date.getHours(), date.getMinutes());
    dataForm.name = newParty.name;
    dataForm.purpose = newParty.purpose;
    dataForm.location = newParty.location;
    updateModel();
}

export function goBack() {
    return topmost().goBack();
}

export async function save() {
    await ModalProgress.show(async (setProgress: TProgress) => {
        dismissSoftKeyboard();
        setProgress(30, localize("progress.saving"));
        await copyViewModelToParty();

        const orgs = orgList.slice() as Contact[];
        // Verify that all organizers have published their personhood public key
        for (const org of orgs) {
            if (!org.personhoodPub) {
                throw new Error(`One of the organisers didn't publish his personhood key`);
            }
        }

        // Create the party
        setProgress(50, localize("personhood.creating"));
        const ppi = await uData.spawnerInstance.spawnPopParty({
            coin: uData.coinInstance,
            desc: newParty,
            orgs: orgs.map((org) => org.darcInstance.id),
            reward: Long.fromNumber(viewModel.get("dataForm").reward),
            signers: [uData.keyIdentitySigner],
        });
        const p = new PartyItem(ppi);
        p.isOrganizer = true;
        setProgress(75, localize("personhood.storing"));
        await uData.addParty(p);
    });
    goBack();
}

export async function addOrg(args: any) {
    // tslint:disable:object-literal-sort-keys
    const result = await dialogs.action({
        title: "Chose organizer",
        cancelButtonText: "Abort",
        actions: uData.contacts.map((f) => f.alias),
    });
    // tslint:enable:object-literal-sort-keys
    const org = uData.contacts.find((f) => f.alias === result);
    if (org != null) {
        await org.updateOrConnect(uData.bc);
        orgList.push(org);
        updateModel();
    }
}
