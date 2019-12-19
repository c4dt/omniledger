import Log from "@dedis/cothority/log";
import { fromObject } from "tns-core-modules/data/observable/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { EventData, Page } from "tns-core-modules/ui/page/page";
import { isAdmin, uData } from "~/lib/byzcoin-def";
import { GroupContract } from "~/lib/dynacred/group/groupContract";
import { GroupContractCollection } from "~/lib/dynacred/group/groupContractCollection";
import { GroupDefinition, IGroupDefinition } from "~/lib/dynacred/group/groupDefinition";

let page: Page;
let gcCollection: GroupContractCollection;
let publicKeyList = [];
let selectedPublicKeys = [];

// tslint:disable: object-literal-sort-keys
const dataForm = fromObject({
    publicKeys: uData.keyIdentity._public.toHex() + ",58d3b216f69dae701feec7595157459d00298a17061fdb13b6f07d6e06a0b00a,77752774c3b56c081a073bcd5793e7fe2cde5a28642af31db2958bdc868240d5",
    suite: "edwards25519",
    purpose: "Testing",
    voteThreshold: ">1/2",
    predecessor: "",
});

const viewModel = fromObject({
    dataForm,
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
    }

    dataForm.set("description", uData.contact.alias);
    console.log("dataForm", dataForm.get("predecessor"));
    console.log("1");
    publicKeyList = [uData.contact];
    console.log("2");
    selectedPublicKeys = [uData.keyIdentity._public];
    console.log("3");
    viewModel.set("publicKeyList", publicKeyList);
    console.log("4");
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
    console.log("1");
    console.log(uData.contacts.length);
    console.log(uData.contacts[0]);
    const result = await dialogs.action({
        title: "Choose an organizer",
        cancelButtonText: "Cancel",
        actions: uData.contacts.map((c) => c.alias),
    });
    console.log("2");
    // console.log(uData.contacts);
    console.log("3");
    console.log("length", uData.contacts.length);
    const publicKey = uData.contacts.find((c) => {
        console.log(c);
        console.log(c.alias);
        return c.alias === result;
    });
    if (publicKey != null) {
        console.log(publicKey);
        selectedPublicKeys.push(publicKey);
    }
}
