import { GroupContract } from "@c4dt/dynacred";
import { GroupContractCollection } from "@c4dt/dynacred";
import { GroupDefinition, IGroupDefinition } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { fromObject, fromObjectRecursive } from "tns-core-modules/data/observable/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { EventData, Page } from "tns-core-modules/ui/page/page";
import { isAdmin, uData } from "~/lib/byzcoin-def";
import { getAliasFromPublicKey } from "~/lib/group-ui";
import { msgFailed } from "~/lib/messages";

let page: Page;
let gcCollection: GroupContractCollection;
const publicKeyList = new ObservableArray<PublicKeyListItem>();
const predecessorList = new ObservableArray<PredecessorListItem>();

const dataForm = fromObject({
    purpose: "",
    suite: "edwards25519",
    voteThreshold: ">1/2",
});

const dataFormDetails = fromObject({
    id: "",
    signoffs: "",
});

const viewModel = fromObjectRecursive({
    dataForm,
    dataFormDetails,
    isAdmin,
    isReadOnly: false,
    publicKeyList,
    predecessorList,
});

// Event handler for Page "navigatingTo" event attached in identity.xml
export async function navigatingTo(args: EventData) {
    Log.lvl1("Displaying configuration page");
    page = args.object as Page;

    publicKeyList.splice(0);
    predecessorList.splice(0);

    if (page.get("navigationContext")) {
        if ("isReadOnly" in page.navigationContext) {
            viewModel.set("isReadOnly", page.navigationContext.isReadOnly);
        }
        if ("id" in page.navigationContext) {
            dataFormDetails.set("id", page.navigationContext.id);
        }
        if ("groupContract" in page.navigationContext) {
            gcCollection = page.navigationContext.gcCollection;
            setDataForm(page.navigationContext.groupContract);
        } else {
            gcCollection = undefined;
            setDataForm();
        }
    }

    page.bindingContext = viewModel;
}

export function goBack() {
    return topmost().goBack();
}

/**
 * Triggered when proposing a new group contract
 */
export async function propose() {
    try {
        Log.llvl1("propose new group contract");
        // tslint:disable: object-literal-sort-keys
        const variables: IGroupDefinition = {
            orgPubKeys: publicKeyList.map((p) => p.publicKey),
            suite: dataForm.get("suite"),
            voteThreshold: dataForm.get("voteThreshold"),
            purpose: dataForm.get("purpose"),
            predecessor: predecessorList.map((p) => p.id),
        };

        // check variables
        // suite has to be edwards25519
        if (variables.suite !== "edwards25519") {
            dialogs.alert("Unfortunately, for the time being, we only allow edwards25519 as suite value.");
        }
        // Test if voteThreshold is well-formed
        const regex = new RegExp("^(>|>=)\\d+/\\d+$");
        if (!regex.test(variables.voteThreshold.replace(/\s/g, ""))) {
            throw new TypeError("The voteThreshold field is not well-formed");
        }

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
            // Check the variables
            if (variables.predecessor.length === 0) {
                dialogs.alert(localize("group_configure.alert_not_enough_predecessor"));
                return;
            }
            // The new group contract has to be different from its predecessor
            // tslint:disable-next-line: max-line-length
            if (groupDefinition.predecessor.length === 1 && groupDefinition.isSimilarTo(gcCollection.getCurrentGroupContract().groupDefinition)) {
                dialogs.alert({
                    title: localize("group_configure.warning"),
                    message: localize("group_configure.alert_different_predecessor"),
                    okButtonText: localize("dialog.ok"),
                });
                return;
            }
            // modify groupContractCollection purpose if it is modified in groupDefinition
            if (groupDefinition.purpose !== gcCollection.purpose) {
                gcCollection.purpose = groupDefinition.purpose;
            }

            const parent = gcCollection.get(predecessorList.getItem(0).id);
            contract = gcCollection.createGroupContract(parent, groupDefinition);
            gcCollection.sign(contract, uData.keyIdentity._private);
        }

        // save the new groupContractCollection
        uData.addGroup(gcCollection);
        await uData.save();

        return topmost().navigate({
            moduleName: "pages/lab/group/group-page",
        });
    } catch (e) {
        msgFailed(e.toString(), "Error");
    }
}

/**
 * Triggered when adding a public key to the list of public keys
 *
 */
export async function addPublicKey(args: any) {
    try {
        const contacts = uData.contacts.concat(uData.contact);
        const contactAliases = contacts.map((c) => c.alias).filter((a) => {
            return publicKeyList.map((p: PublicKeyListItem) => p.alias).indexOf(a) === -1;
        });
        const cancelText = localize("dialog.cancel");
        let result = await dialogs.action({
            title: localize("group_configure.choose_organizer"),
            cancelButtonText: cancelText,
            actions: contactAliases,
        });

        if (result === cancelText) {
            return;
        }

        const contact = contacts.find((c) => {
            return c.alias === result;
        });

        if (contact !== null) {
            const devices = await contact.getDevices();
            const pubKeys = devices.map((d) => d.pubKey.toHex());
            // choose invariably the first public key
            let selectedPubKey: string;
            if (pubKeys.length > 1) {
                result = await dialogs.action({
                    title: localize("group_configure.which_public_key"),
                    cancelButtonText: cancelText,
                    actions: pubKeys,
                });

                if (result === cancelText) {
                    return;
                }

                selectedPubKey = pubKeys.find((pk) => result === pk);
            } else {
                selectedPubKey = pubKeys[0];
            }

            publicKeyList.push(new PublicKeyListItem(contact.alias, selectedPubKey));
        }
    } catch (e) {
        return msgFailed(e.toString(), "Error");
    }
}

/**
 * Triggered when removing a specific public key
 *
 */
export function removePublicKey(args: any) {
    const context = args.view.bindingContext;
    if (!context) {
        return;
    }
    const aliasToRemove = context.alias;
    const pubKeyToRemove = context.publicKey;
    let idxToRemove = -1;
    for (let i = 0; i < publicKeyList.length; i++) {
        const item = publicKeyList.getItem(i);
        if (item.alias === aliasToRemove && item.publicKey === pubKeyToRemove) {
            idxToRemove = i;
            break;
        }
    }

    if (idxToRemove > -1) {
        publicKeyList.splice(idxToRemove, 1);
    }
}

/**
 * Triggered when adding a predecessor to the predecessor list
 *
 */
export async function addPredecessor(args: any) {
    try {
        if (gcCollection === undefined || gcCollection.collection.size === 0) {
            await dialogs.alert(localize("group_configure.alert_no_predecessor"));
            return;
        }

        const gcIds = Array.from(gcCollection.collection.keys()).filter((id) => {

            return predecessorList.map((p: PredecessorListItem) => p.id).indexOf(id) === -1;
        });
        const cancelText = localize("dialog.cancel");
        const result = await dialogs.action({
            title: localize("choose_predecessor"),
            cancelButtonText: cancelText,
            actions: gcIds,
        });

        if (result === cancelText) {
            return;
        }

        const selectedId = gcIds.find((id: string) => {
            return id === result;
        });
        if (selectedId !== null) {
            predecessorList.push(new PredecessorListItem(selectedId));
        }
    } catch (e) {
        msgFailed(e.toString(), "Error");
    }
}

/**
 * Triggered when removing a specific predecessor
 *
 */
export function removePredecessor(args: any) {
    const context = args.view.bindingContext;
    if (!context) {
        return;
    }
    const idToRemove = context.id;
    let idxToRemove = -1;
    for (let i = 0; i < predecessorList.length; i++) {
        const item = predecessorList.getItem(i);
        if (item.id === idToRemove) {
            idxToRemove = i;
            break;
        }
    }

    if (idxToRemove > -1) {
        predecessorList.splice(idxToRemove, 1);
    }
}

/**
 * Set the dataForm variable
 * If groupContract exists then set the dataForm according to groupContract,
 * otherwise set to a default value
 *
 * @param groupContract
 */
async function setDataForm(groupContract?: GroupContract) {
    try {
        if (groupContract) {
            Log.print("setDataForm there is a group contract");
            dataForm.set("publicKeys", groupContract.publicKeys.join(","));
            dataForm.set("suite", groupContract.groupDefinition.suite);
            dataForm.set("purpose", groupContract.purpose);
            dataForm.set("voteThreshold", groupContract.voteThreshold);

            // set publicKeyList
            const userContact = await uData.contact.getDevices();
            const promises = [];
            for (const contact of uData.contacts) {
                promises.push(contact.getDevices());
            }
            const devicesPerContacts = await Promise.all(promises);

            groupContract.publicKeys.forEach(async (pubKey) => {
                if (pubKey === userContact[0].pubKey.toHex()) {
                    // user's public key
                    publicKeyList.push(new PublicKeyListItem(uData.contact.alias, userContact[0].pubKey.toHex()));
                } else {
                    // contact's public key
                    const alias = getAliasFromPublicKey(pubKey, devicesPerContacts);
                    Log.print("setDataForm alias", pubKey);
                    if (alias) {
                        publicKeyList.push(new PublicKeyListItem(alias, pubKey));
                    } else {
                        Log.print("setDataForm correct");
                        publicKeyList.push(new PublicKeyListItem(pubKey.slice(0, 5), pubKey));
                    }
                }
            });

            // set predecessorList
            if (page.navigationContext.isPredecessor) {
                dataForm.set("predecessor", groupContract.id);
                predecessorList.push(new PredecessorListItem(groupContract.id));
            } else {
                dataForm.set("predecessor", groupContract.predecessor ? groupContract.predecessor.join(",") : "");
                if (groupContract.predecessor.length !== 0) {
                    predecessorList.push(new PredecessorListItem(groupContract.predecessor[0]));
                }
            }
        } else {
            Log.print("setDataForm there is no group contract");
            dataForm.set("suite", "edwards25519");
            dataForm.set("purpose", "");
            dataForm.set("voteThreshold", ">1/2");
            dataForm.set("description", uData.contact.alias);
            const pubKey = (await (uData.contact.getDevices())).map((d) => d.pubKey.toHex())[0];
            publicKeyList.push(new PublicKeyListItem(uData.contact.alias, pubKey));
        }
    } catch (e) {
        msgFailed(e.toString(), "Error");
    }
}

/**
 * Utility class representing a public key in publicKeyList array
 */
class PublicKeyListItem {
    alias: string;
    publicKey: string;

    constructor(alias: string, publicKey: string) {
        this.alias = alias;
        this.publicKey = publicKey;
    }
}

/**
 * Utility class representing a predecessor in predecessorList array
 */
class PredecessorListItem {
    id: string;

    constructor(id: string) {
        this.id = id;
    }

    get displayId(): string {
        return this.id.slice(0, 5) + "...";
    }
}
