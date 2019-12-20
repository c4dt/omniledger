import Log from "@dedis/cothority/log";
import { fromNativeSource } from "tns-core-modules/image-source/image-source";
import { screen } from "tns-core-modules/platform";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { scan } from "~/lib/scan";
import { KeyPair } from "./dynacred";
import { GroupContract, GroupContractCollection } from "./dynacred/group";
import { msgFailed } from "./messages";

// tslint:disable-next-line: max-line-length
export async function scanNewGroupContract(gcCollection: GroupContractCollection, kp: KeyPair): Promise<GroupContractCollection> {
    try {
        const result = await scan("{{ L('group.camera_text') }}");
        console.log("scan1");
        const groupContract = GroupContract.createFromJSON(JSON.parse(result.text));

        console.log("scan2");
        // cannot accept a group contract where the user public key is not included
        if (groupContract.groupDefinition.publicKeys.indexOf(kp._public.toHex()) === -1) {
            throw new Error("This group contract does not contain your public key.");
        }
        console.log("scan3");
        if (gcCollection.get(groupContract.id)) {
            // already existing group contract
            gcCollection.append(groupContract);
        } else {
            // tslint:disable: object-literal-sort-keys
            // not yet aware of this group contract
            if (!groupContract.groupDefinition.predecessor.length) {
                // a user can only accept or not the genesis group contract
                const options = {
                    title: "Do you want to accept this new group contract?",
                    message: groupContract.groupDefinition.toString(),
                    okButtonText: "Yes",
                    cancelButtonText: "No",
                };
                await dialogs.confirm(options).then((choice: boolean) => {
                    if (choice) {
                        gcCollection.purpose = groupContract.groupDefinition.purpose;
                        gcCollection.append(groupContract);
                        // do not sign if it is the genesis group contract c0
                        // if (groupContract.groupDefinition.predecessor.length) {
                        //     gcCollection.sign(groupContract, kp._private);
                        // }
                    }
                });
            } else {
                const accept = "Accept";
                const keep = "Keep";
                const dismiss = "Dismiss";
                const action = {
                    title: "How do you want to handle this new group contract?",
                    message: groupContract.groupDefinition.toString(),
                    actions: [accept, keep],
                    cancelButtonText: dismiss,
                };
                await dialogs.action(action).then((r: string) => {
                    switch (r) {
                        case dismiss:
                            break;
                        case accept:
                            gcCollection.purpose = groupContract.groupDefinition.purpose;
                            gcCollection.append(groupContract);
                            gcCollection.sign(groupContract, kp._private);
                            break;
                        case keep:
                            gcCollection.purpose = groupContract.groupDefinition.purpose;
                            gcCollection.append(groupContract);
                            break;
                    }
                })
            }
        }
        console.log("scan4");
        return gcCollection;

    } catch (e) {
        await msgFailed(e.toString(), "Error");
    }
}

export function showQR(groupContract: GroupContract) {
    // QR code utilies
    // tslint:disable: variable-name
    const ZXing = require("nativescript-zxing");
    const QrGenerator = new ZXing();

    const qrVariables = {
        groupDefinition: groupContract.groupDefinition.toJSON(),
        signoffs: groupContract.signoffs,
    };
    const sideLength = screen.mainScreen.widthPixels / 2;
    const qrCode = QrGenerator.createBarcode({
        encode: JSON.stringify(qrVariables),
        format: ZXing.QR_CODE,
        height: sideLength,
        width: sideLength,
    });

    topmost().showModal("pages/modal/modal-group", fromNativeSource(qrCode),
        () => { Log.print("ok"); }, false, false, false);
}
