import { Observable } from "tns-core-modules/data/observable";
import { screen } from "tns-core-modules/platform";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view/list-view";
import { uData } from "~/lib/byzcoin-def";
import { GroupContract } from "~/lib/dynacred/group/groupContract";
import { GroupContractCollection } from "~/lib/dynacred/group/groupContractCollection";
import { scanNewGroupContract, showQR } from "~/lib/group-ui";
import { msgFailed } from "~/lib/messages";
import { groupList } from "./group-page";

export class GroupListView extends Observable {

    private _groups: GroupView[];

    constructor() {
        super();

        // Initialize
        this.updateGroupList();
    }

    async updateGroupList() {
        this._groups = uData.groups.map((g) => new GroupView(g));
        this.set("groups", this._groups);
    }
}

export class GroupView extends Observable {

    private _group: GroupContractCollection;

    constructor(group: GroupContractCollection) {
        super();

        this._group = group;
    }

    async selectGroup(arg: ItemEventData) {
        const propNewContract = "Propose New Group Contract";
        const propContract = "Show Proposed Group Contract QR Code";
        const currContract = "Show Current Group Contract QR Code";
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
                    topmost().navigate({
                        moduleName: "pages/lab/group/configure/configure-page",
                        context: {
                            isReadOnly: false,
                            predecessor: this._group.getCurrentGroupContract().id,
                            gcCollection: this._group,
                        },
                    });
                    break;
                case propContract:
                    const propGroupContract = this._group.getProposedGroupContract();
                    if (propGroupContract) {
                        showQR(propGroupContract);
                    }
                    break;
                case currContract:
                    const currGroupContract = this._group.getCurrentGroupContract();
                    if (currGroupContract) {
                        showQR(currGroupContract);
                    }
                    break;
                case details:
                    topmost().navigate({
                        moduleName: "pages/lab/group/details/details-page",
                        context: {
                            gcCollection: this._group,
                        },
                    });
                    break;
                case update:
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
                    const options = {
                        title: "Do you want to delete this group?",
                        okButtonText: "Yes",
                        cancelButtonText: "No",
                    };
                    dialogs.confirm(options).then(async (choice: boolean) => {
                        if (choice) {
                            uData.rmGroup(this._group);
                            await uData.save();
                            groupList.updateGroupList();
                        }
                    });
                    break;
            }
        } catch (e) {
            await msgFailed(e.toString(), "Error");
        }

    }

    get purpose(): string {
        return this._group.purpose;
    }

    set group(group: GroupContractCollection) {
        this._group = group;
    }
}
