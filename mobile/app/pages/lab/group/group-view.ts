import Log from "@dedis/cothority/log";
import { Observable } from "tns-core-modules/data/observable";
import { fromNativeSource } from "tns-core-modules/image-source/image-source";
import { screen } from "tns-core-modules/platform";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view/list-view";
import { uData } from "~/lib/byzcoin-def";
import { GroupContract } from "~/lib/dynacred/group/groupContract";
import { GroupContractCollection } from "~/lib/dynacred/group/groupContractCollection";
import { msgFailed } from "~/lib/messages";
import { scan } from "~/lib/scan";

// QR code utilies
const ZXing = require("nativescript-zxing");
const QrGenerator = new ZXing();

export class GroupListView extends Observable {

    private _groups: GroupView[];

    constructor(groupList: GroupContractCollection[]) {
        super();

        // Initialize default values
        this.updateGroupList(groupList);
    }

    updateGroupList(groupList: GroupContractCollection[]) {
        console.log("updateGroupList1");
        this._groups = groupList.map((g) => new GroupView(g));
        console.log("updateGroupList2");
        this.notifyUpdate();
        console.log("updateGroupList3");
    }

    notifyUpdate() {
        this.notifyPropertyChange("groups", this._groups);
    }
}

export class GroupView extends Observable {

    private _group: GroupContractCollection;

    constructor(group: GroupContractCollection) {
        super();

        this._group = group;
    }

    async selectGroup(arg: ItemEventData) {
        const propNewContract = "Propose New Contract";
        const propContract = "Proposed Contract";
        const currContract = "Current Contract";
        const details = "Details";
        const update = "Update";
        const _delete = "Delete";
        const actions = [propNewContract, propContract, currContract, details, update, _delete];
        const cancel = "Cancel";

        try {
            const action = await dialogs.action({
                message: "Select action",
                cancelButtonText: cancel,
                actions,
            });

            switch (action) {
                case cancel:
                    break;
                case propNewContract:
                    // TODO
                    console.log(this._group.getCurrentGroupContract(uData.keyIdentity._public.toHex()));
                    topmost().navigate({
                        moduleName: "pages/lab/group/configure/configure-page",
                        context: {
                            parent: this._group.getCurrentGroupContract(uData.keyIdentity._public.toHex()),
                        },
                    });
                    break;
                case propContract:
                    const propGroupContract = this._group.getProposedGroupContract();
                    if (propGroupContract) {
                        this.showQR(propGroupContract);
                    }
                    break;
                case currContract:
                    const currGroupContract = this._group.getCurrentGroupContract(uData.keyIdentity._public.toHex());
                    if (currGroupContract) {
                        this.showQR(currGroupContract);
                    }
                    break;
                case details:
                    break;
                case update:
                    try {
                        await this._group.scanNewGroupContract(uData.keyIdentity);
                        // await this.addScan();
                    } catch (e) {
                        await msgFailed(e.toString(), "Error");
                    }
                    break;
                case _delete:
                    break;
                default:
                    console.log(action);
            }
        } catch (e) {
            await msgFailed(e.toString(), "Error");
        }

    }

    private showQR(groupContract: GroupContract) {
        const qrVariables = {
            groupDefinition: groupContract.groupDefinition.toJSON(),
            signoffs: groupContract.signoffs,
        };
        const sideLength = screen.mainScreen.widthPixels / 3;
        const qrCode = QrGenerator.createBarcode({
            encode: JSON.stringify(qrVariables),
            format: ZXing.QR_CODE,
            height: sideLength,
            width: sideLength,
        });

        topmost().showModal("pages/modal/modal-key", fromNativeSource(qrCode),
            () => { Log.print("ok"); }, false, false, false);
    }

    private async addScan() {
        try {

            // const result = await scan("{{ L('group.camera_text') }}");
            // const groupContract = GroupContract.createFromJSON(JSON.parse(result.text));

            // // cannot accept a group contract where the user public key is not included
            // if (groupContract.groupDefinition.publicKeys.indexOf(uData.keyIdentity._public.toHex()) === -1) {
            //     throw new Error("This group contract does not contain your public key.");
            // }
            // if (this._group.get(groupContract.id)) {
            //     // already existing group contract
            //     this._group.append(groupContract);
            // } else {
            //     // not yet aware of this group contract
            //     const options = {
            //         title: "Do you want to accept this new group contract?",
            //         message: groupContract.groupDefinition.toString(),
            //         okButtonText: "Yes",
            //         cancelButtonText: "No",
            //     };
            //     dialogs.confirm(options).then((result: boolean) => {
            //         console.log(result);
            //     });
            // }
        } catch (e) {
            await msgFailed(e.toString(), "Error");
        }
    }

    get alias(): string {
        return this._group.purpose;
    }

    set group(group: GroupContractCollection) {
        this._group = group;
    }
}
