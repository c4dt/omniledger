import Log from "@dedis/cothority/log";
import { fromObject } from "tns-core-modules/data/observable/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { EventData, Page } from "tns-core-modules/ui/page/page";
import { isAdmin, uData } from "~/lib/byzcoin-def";
import { GroupContract } from "~/lib/dynacred/group/groupContract";
import { GroupContractCollection } from "~/lib/dynacred/group/groupContractCollection";
import { GroupDefinition, IGroupDefinition } from "~/lib/dynacred/group/groupDefinition";
import { msgFailed } from "~/lib/messages";
import { Contact } from "~/lib/dynacred";

let page: Page;
let gcCollection: GroupContractCollection;
let publicKeyList = [];
let selectedPublicKeys = [];

// tslint:disable: object-literal-sort-keys
const dataForm = fromObject({
    publicKeys: uData.keyIdentity._public.toHex() + ",b4c19e66fc8a43b3c682fc62a854723d57b9ff440baf74be7222cc9fd08ac956,d2b034bb987fb01a35d25d3c89f674ba01b512b1a2f4f3a673f78194ec798edc",
    suite: "edwards25519",
    purpose: "Testing",
    voteThreshold: ">1/2",
    predecessor: "",
});

const dataFormDetails = fromObject({
    id: "",
    signoffs: "",
});

const viewModel = fromObject({
    dataForm,
    dataFormDetails,
    isAdmin,
    isReadOnly: false,
    networkStatus: "",
    publicKeyList,
});

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    Log.print("new groupContract");
    page = args.object as Page;
    page.bindingContext = viewModel;

    if (page.get("navigationContext")) {
        if ("isReadOnly" in page.navigationContext) {
            viewModel.set("isReadOnly", page.navigationContext.isReadOnly);
        }
        if ("predecessor" in page.navigationContext) {
            dataForm.set("predecessor", page.navigationContext.predecessor);
            gcCollection = page.navigationContext.gcCollection;
        }
        if ("id" in page.navigationContext) {
            dataFormDetails.set("id", page.navigationContext.id);
        }
    }

    dataForm.set("description", uData.contact.alias);
    publicKeyList = [uData.contact];
    selectedPublicKeys = [uData.keyIdentity._public];
    viewModel.set("publicKeyList", publicKeyList);
    // dataForm.set("publicKeys", "bonjour"); TODO pour update le form
}

export function goBack() {
    return topmost().goBack();
}

export async function propose() {
    Log.llvl1("propose new group contract");
    // TODO check the fields
    // tslint:disable: object-literal-sort-keys
    const variables: IGroupDefinition = {
        orgPubKeys: dataForm.get("publicKeys").split(","),
        suite: dataForm.get("suite"),
        voteThreshold: dataForm.get("voteThreshold"),
        purpose: dataForm.get("purpose"),
        predecessor: dataForm.get("predecessor") ? [dataForm.get("predecessor")] : undefined,
    };
    let groupDefinition = new GroupDefinition(variables);
    let contract: GroupContract;
    if (!gcCollection) {
        gcCollection = new GroupContractCollection(variables.purpose);
        // genesis group contract: c0
        contract = gcCollection.createGroupContract(undefined, groupDefinition);
        // group contract: c1
        groupDefinition = new GroupDefinition(groupDefinition.allVariables);
        contract = gcCollection.createGroupContract(contract, groupDefinition);
        gcCollection.sign(contract, uData.keyIdentity._private);
    } else {
        console.log("gcCollection", gcCollection);
        if (groupDefinition.isSimilarTo(gcCollection.getCurrentGroupContract().groupDefinition)) {
            dialogs.alert({
                title: "Warning",
                message: "A proposed contract needs to be different from its predecessor(s).",
                okButtonText: "Ok",
            });
            return;
        }
        contract = gcCollection.createGroupContract(gcCollection.getCurrentGroupContract(), groupDefinition);
        gcCollection.sign(contract, uData.keyIdentity._private);
    }

    // save the new groupContractCollection
    uData.addGroup(gcCollection);
    await uData.save();

    return topmost().navigate({
        moduleName: "pages/lab/group/group-page",
    });
}

export async function addPublicKey(args: any) {
    try {
        const result = await dialogs.action({
            title: "Choose an organizer",
            cancelButtonText: "Cancel",
            actions: uData.contacts.map((c) => c.alias),
        });
        console.log("3");
        console.log("length", uData.contacts.length);
        // console.log("gris", await uData.contacts[0].getDevices());
        // const devices = await uData.contact[0].getDevices();
        // console.log("a");
        // const pubKeys = devices.map((dev) => dev.pubKey);
        // console.log("a");
        // Log.print(pubKeys[0].point);
        console.log("4");
        const contact = uData.contacts.find((c) => {
            console.log(c.alias);
            return c.alias === result;
        });
        console.log("5", contact !== null);
        if (contact != null) {
            const devices = await contact.getDevices();
            console.log("devices");
            const publicKeys = devices.map((d) => d.pubKey);
            // TODO if there is multiple public key need to choose!
            publicKeyList.push(contact as Contact);
            console.log("publicKeyList", publicKeyList);
            viewModel.set("publicKeyList", publicKeyList);
        }
    } catch (e) {
        console.log("error ma gueule");
        msgFailed(e.toString(), "Error");
    }
}
