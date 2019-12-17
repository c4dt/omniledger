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
let publicKeyList = [];
let selectedPublicKeys = [];

// tslint:disable: object-literal-sort-keys
const dataForm = fromObject({
    publicKeys: uData.keyIdentity._public.toHex() + ",fa19ecaa741b60fac42b5120229e3cea7cba1e8c045e8123531906a0d3e8f868",
    suite: "edwards25519",
    purpose: "Testing",
    voteThreshold: ">1/2",
    predecessor: "",
});

const viewModel = fromObject({
    dataForm,
    isAdmin,
    networkStatus: "",
    publicKeyList,
});

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    Log.print("new groupContract");
    page = args.object as Page;
    page.bindingContext = viewModel;
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
        predecessor: dataForm.get("predecessor"),
    };
    let groupDefinition = new GroupDefinition(variables);
    let contract: GroupContract;
    const gcCollection = new GroupContractCollection(variables.purpose);
    // genesis group contract: c0
    contract = gcCollection.createGroupContract(undefined, groupDefinition);
    // group contract: c1
    groupDefinition = new GroupDefinition(groupDefinition.allVariables);
    contract = gcCollection.createGroupContract(contract, groupDefinition);
    gcCollection.sign(contract, uData.keyIdentity._private);

    // save the new groupContractCollection
    uData.addGroup(gcCollection);
    await uData.save();

    return topmost().navigate({
        moduleName: "pages/lab/group/group-page",
    });
}

export async function addPublicKey(args: any) {
    console.log("1");
    const result = await dialogs.action({
        title: "Choose an organizer",
        cancelButtonText: "Cancel",
        actions: uData.contacts.map((c) => c.alias),
    });
    console.log("2");
    // console.log(uData.contacts);
    console.log("3");
    console.log("result");
    console.log(uData);
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
