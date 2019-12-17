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
import { scanNewGroupContract } from "~/lib/group-ui";
import { msgFailed } from "~/lib/messages";
import { scan } from "~/lib/scan";
import { groupList } from "./group-page";

// QR code utilies
const ZXing = require("nativescript-zxing");
const QrGenerator = new ZXing();

export class GroupListView extends Observable {

    private _groups: GroupView[];

    constructor() {
        super();

        // Initialize default values
        this.updateGroupList();
    }

    async updateGroupList() {
        this._groups = uData.groups.map((g) => new GroupView(g));
        this.set("groups", this._groups);
    }

    // notifyUpdate() {
    //     this.notifyPropertyChange("groups", this._groups);
    // }
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
            // tslint:disable: object-literal-sort-keys
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
                    // TODO il faut update l'affichage?
                    try {
                        const groupContractionCollection = await scanNewGroupContract(this._group, uData.keyIdentity);
                        uData.addGroup(groupContractionCollection);
                        await uData.save();
                        groupList.updateGroupList();
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

    get alias(): string {
        return this._group.purpose;
    }

    set group(group: GroupContractCollection) {
        this._group = group;
    }
}
