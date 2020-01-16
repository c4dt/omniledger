import { localize } from "nativescript-localize";
import { Observable } from "tns-core-modules/data/observable";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view/list-view";
import { uData } from "~/lib/byzcoin-def";
import { GroupContractCollection } from "@c4dt/dynacred";
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
    /**
     * Triggered when tapping a group
     * Display an action dialog
     *
     */
    async selectGroup(arg: ItemEventData) {
        const propNewContract = localize("group.propose_contract");
        const propContract = localize("group.show_proposed_contract");
        const currContract = localize("group.show_current_contract");
        const details = localize("group_details.title");
        const update = localize("dialog.update");
        const _delete = localize("dialog.delete");
        const actions = [propNewContract, propContract, currContract, details, update, _delete];
        const cancel = localize("dialog.cancel");

        try {
            // tslint:disable: object-literal-sort-keys
            const action = await dialogs.action({
                message: localize("group.select_action"),
                cancelButtonText: cancel,
                actions,
            });

            switch (action) {
                case cancel:
                    break;
                case propNewContract:
                    if (!this._group.getCurrentGroupContract()) {
                        dialogs.alert(localize("group.cannot_propose"));
                        break;
                    }
                    topmost().navigate({
                        moduleName: "pages/lab/group/configure/configure-page",
                        context: {
                            isReadOnly: false,
                            groupContract: this._group.getCurrentGroupContract(),
                            isPredecessor: true,
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
                    const groupContractionCollection = await scanNewGroupContract(this._group, uData.keyIdentity);
                    if (groupContractionCollection) {
                        uData.addGroup(groupContractionCollection);
                        await uData.save();
                        groupList.updateGroupList();
                    }
                    break;
                case _delete:
                    const options = {
                        title: localize("group.delete_group"),
                        okButtonText: localize("dialog.yes"),
                        cancelButtonText: localize("dialog.no"),
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
