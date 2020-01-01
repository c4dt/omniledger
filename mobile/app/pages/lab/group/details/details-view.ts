import { localize } from "nativescript-localize";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame/frame";
import { ItemEventData } from "tns-core-modules/ui/list-view/list-view";
import { Observable } from "tns-core-modules/ui/page/page";
import { uData } from "~/lib/byzcoin-def";
import { ENCODING, GroupContract, GroupContractCollection } from "~/lib/dynacred/group";
import { showQR } from "~/lib/group-ui";
import { msgFailed } from "~/lib/messages";

/**
 * Class representing the whole list
 */
export class GroupContractListView extends Observable {

    private _groupContracts: GroupContractView[];

    constructor(group: GroupContractCollection) {
        super();

        // Initialize
        this.updateGroupContractList(group);
    }

    async updateGroupContractList(group: GroupContractCollection) {
        this._groupContracts = Array.from(group.collection.values()).map((gc) => new GroupContractView(gc, group));
        this.set("groupContracts", this._groupContracts);
    }
}

/**
 * Class representing an item (a group contract) of the list
 */
export class GroupContractView extends Observable {

    private _isAccepted: boolean;
    private _isSigned: boolean;
    private _isCurrentGroupContract: boolean;
    private _groupContract: GroupContract;

    constructor(group: GroupContract, gcCollection: GroupContractCollection) {
        super();

        this._groupContract = group;

        if (group.groupDefinition.predecessor.length) {
            this._isAccepted = gcCollection.isAccepted(group);
        } else {
            // genenis group contract c0
            this._isAccepted = true;
        }

        this._isSigned = false;
        const publicKey = uData.keyIdentity._public.toHex();
        for (const signoff of group.signoffs) {
            if (group.groupDefinition.verifySignoffWithPublicKey(signoff, publicKey, Buffer.from(group.id, ENCODING))) {
                this._isSigned = true;
                break;
            }
        }

        this._isCurrentGroupContract = this._isAccepted && (group.id === gcCollection.getCurrentGroupContract().id);
    }

    /**
     * Triggered when selecting a list item
     *
     */
    async selectGroupContract(arg: ItemEventData) {
        const showDefinition = localize("group_details.show_definition");
        const showQr = localize("group_details.show_qr");
        const actions = [showDefinition, showQr];
        const cancel = localize("dialog.cancel");

        try {
            // tslint:disable: object-literal-sort-keys
            const action = await dialogs.action({
                cancelButtonText: cancel,
                actions,
            });

            switch (action) {
                case cancel:
                    break;
                case showDefinition:
                    // tslint:disable: object-literal-sort-keys
                    topmost().navigate({
                        moduleName: "pages/lab/group/configure/configure-page",
                        context: {
                            isReadOnly: true,
                            id: this._groupContract.id,
                            isPredecessor: false,
                            groupContract: this._groupContract,
                            gcCollection: undefined,
                        },
                    });
                    break;
                case showQr:
                    showQR(this._groupContract);
                    break;
            }
        } catch (e) {
            await msgFailed(e.toString(), "Error");
        }
    }

    get isAccepted(): boolean {
        return this._isAccepted;
    }

    get isSigned(): boolean {
        return this._isSigned;
    }

    get isGenesis(): boolean {
        return this._groupContract.predecessor.length === 0;
    }

    get isCurrentGroupContract(): boolean {
        return this._isCurrentGroupContract;
    }

    get id(): string {
        let alias = "id: " + this._groupContract.id.slice(0, 15) + "...";
        if (this.isGenesis) {
            alias = "Genesis ".concat(alias);
        }
        return alias;
    }

    get purpose(): string {
        return this._groupContract.groupDefinition.purpose;
    }

    get hasPredecessor(): boolean {
        return this._groupContract.predecessor.length !== 0;
    }

    get predecessor(): string {
        const length = this._groupContract.predecessor.length !== 0 ? this._groupContract.predecessor.length : 1;
        return this._groupContract.predecessor.map((p: string) => p.slice(0, 15 / length) + "...").join(", ");
    }

    set groupContract(groupContract: GroupContract) {
        this._groupContract = groupContract;
    }
}
