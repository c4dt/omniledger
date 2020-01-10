// tslint:disable-next-line
require("nativescript-nodeify");

import { Private } from "../KeyPair";
import { GroupContract } from "./groupContract";
import { GroupDefinition } from "./groupDefinition";

/**
 * Class collecting group contracts from the same group
 */
export class GroupContractCollection {

    static fromObject(obj: any) {
        const gcCollection = new GroupContractCollection();

        if (obj.collection) {
            Object.keys(obj.collection).forEach((id) => {
                gcCollection._collection.set(id,
                    obj.collection[id].map((gc: any) => GroupContract.fromObject(gc)),
                );
            });
        }

        if (obj.currentGroupContract) {
            gcCollection.currentGroupContract = GroupContract.fromObject(obj.currentGroupContract);
        }

        if (obj._purpose) {
            gcCollection._purpose = obj._purpose;
        }

        return gcCollection;
    }

    private _collection: Map<string, GroupContract>; // key: contractID, value: GroupDefinition
    private _purpose: string;
    private currentGroupContract: GroupContract;

    constructor(purpose?: string) {
        this._collection = new Map();
        this._purpose = purpose ? purpose : undefined;
    }

    /**
     * Create new group contract
     *
     * @param parent new group contract's predecessor
     * @param groupDefinition new group contract's group definition
     * @returns {GroupContract} new group contract
     */
    createGroupContract(parent: GroupContract, groupDefinition: GroupDefinition): GroupContract {
        try {
            let newGroupContract: GroupContract;
            if (parent) {
                newGroupContract = parent.proposeGroupContract(groupDefinition);
            } else {
                newGroupContract = new GroupContract(groupDefinition);
            }
            this.append(newGroupContract);

            return newGroupContract;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Sign a specific group contract with a specific private key
     * And append the signoff to the specific group contract
     *
     * @param groupContract
     * @param privateKey
     * @returns {boolean} true if signature successful, otherwise false
     */
    sign(groupContract: GroupContract, privateKey: Private): boolean {
        try {
            // create signoff
            const signoff: string = groupContract.groupDefinition.sign(privateKey);
            // append signoff to groupContract
            const parents: GroupContract[] = this.getParent(groupContract);
            let isAppended = false;
            for (let i = 0; i < parents.length && !isAppended; i++) {
                isAppended = groupContract.appendSignoff(signoff, parents[i]);
            }

            // if groupContract is accepted; therefore, it becomes the current group contract
            if (isAppended && this.isAccepted(groupContract)) {
                this.currentGroupContract = groupContract;
            }

            return isAppended;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Append a group contract to this collection
     *
     * @param groupContract
     * @param keepOnly if true do not make the group contract the current one
     */
    append(groupContract: GroupContract, keepOnly: boolean = false) {
        try {
            // only proceed if the the groupContract is sound
            const parents = this.getParent(groupContract);
            if (parents.length) {
                if (!groupContract.verify(...this.getParent(groupContract))) {
                    throw new TypeError("The group contract verification failed.");
                }
            } else {
                if (!groupContract.verify(undefined)) {
                    throw new TypeError("The group contract verification failed.");
                }
            }

            // check if the id is not already there
            const existing: GroupContract[] = [];
            this._collection.forEach((gd: GroupContract) => {
                if (gd.id === groupContract.id) {
                    existing.push(gd);
                }
            });

            if (existing.length) {
                groupContract.mergeSignoffs(existing[0]);
                this._collection.set(groupContract.id, groupContract);
            } else {
                // there is a new proposed group contract; therefore, erase the current proposed group contract
                this.removeProposedGroupContract();

                this._collection.set(groupContract.id, groupContract);
            }

            // if groupContract is accepted; therefore, it becomes the current group contract
            const numbPredecessor = groupContract.groupDefinition.predecessor.length;
            if (!keepOnly && (numbPredecessor === 0 || (numbPredecessor > 0 && this.isAccepted(groupContract)))) {
                this.currentGroupContract = groupContract;
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     *
     * @param groupContract
     * @returns {boolean} true if the collection has the group contract, otherwise false
     */
    has(groupContract: GroupContract): boolean {
        return this._collection.has(groupContract.id);
    }

    /**
     * Returns group contract by id
     *
     * @param id
     * @returns {GroupContract}
     */
    get(id: string): GroupContract {
        return this._collection.get(id);
    }

    getCurrentGroupContract(): GroupContract {
        return this.currentGroupContract;
    }

    getProposedGroupContract(): GroupContract {
        try {
            for (const gc of Array.from(this._collection.values())) {
                // avoid returning the genesis group contract
                if (gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc)) {
                    return gc;
                }
            }

            return undefined;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get worldview from a specific group contract
     *
     * @param groupContract
     * @returns an array of direct successor(s)
     */
    getWorldView(groupContract: GroupContract) {
        return this.getChildren(groupContract);
    }

    /**
     * Get worldview from a specific group contract
     *
     * @param groupContract
     * @returns returns [gd] if there is no child to groupContract,
     * returns [[gd,gd2], [gd,gd3]] if there is two children to groupContract
     */
    // getWorldView(groupContract: GroupContract) {
    //     const children = this.getChildren(groupContract);
    //     if (!children.length) {
    //         return [groupContract];
    //     } else {
    //         return children.map((c: GroupContract) => {
    //             return [].concat(...[groupContract].concat(this.getWorldView(c)));
    //         });
    //     }
    // }

    getParent(groupContract: GroupContract): GroupContract[] {
        if (!groupContract.predecessor.length) {
            return [];
        }

        return groupContract.predecessor.map((id: string) => this._collection.get(id));
    }

    getChildren(groupContract: GroupContract): GroupContract[] {
        if (!groupContract.successor.length) {
            return [];
        }

        return groupContract.successor.map((id: string) => this._collection.get(id));
    }

    /**
     * Test if a specific group contract has been accepted
     *
     * @param groupContract
     * @returns {boolean} true if accepted, otherwise false
     */
    isAccepted(groupContract: GroupContract): boolean {
        // based upon delegation of trust
        try {
            if (!groupContract.predecessor.length) {
                throw new TypeError("The groupContract has to have at least one predecessor");
            }

        // if groupDefinition is not included into the collection, append it
        if (!this.has(groupContract)) {
            this.append(groupContract);
        }
        const parent = this.getParent(groupContract);
        if (!groupContract.verify(...parent)) {
            return false;
        }
        const verifiedParent = parent.map((p: GroupContract) => {
            // we count the number of signoffs for a specific parent because
            // when there is multiple parent each parent vote threshold need to be reached
            // by the organizers in the parent (not all the organizers of the current group)
            let numbSignoffsByParent = 0;
            for (const s of groupContract.signoffs) {
                if (groupContract.groupDefinition.verifySignoff(s, p.groupDefinition)) {
                    numbSignoffsByParent++;
                }
            }
            const verifiedParent = parent.map((p: GroupContract) => {
                // we count the number of signoffs for a specific parent because
                // when there is multiple parent each parent vote threshold need to be reached
                // by the organizers in the parent (not all the organizers of the current group)
                let numbSignoffsByParent = 0;
                for (const s of groupContract.signoffs) {
                    if (groupContract.groupDefinition.verifySignoff(s, p.groupDefinition)) {
                        numbSignoffsByParent++;
                    }
                }

                return this.meetVoteThreshold(p.voteThreshold, numbSignoffsByParent / p.publicKeys.length);
            });

            return verifiedParent.reduce((bool1, bool2) => bool1 && bool2);
        } catch (e) {
            throw e;
        }
    }

    toObject(): object {
        const obj = {
            collection: {} as any,
            currentGroupContract: this.currentGroupContract ? this.currentGroupContract.toObject() : undefined,
            purpose: this._purpose,
        };
        this._collection.forEach((gc: GroupContract, id: string) => obj.collection[id] = gc.toObject());
        return obj;
    }

    get purpose(): string {
        return this._purpose;
    }

    set purpose(purpose: string) {
        this._purpose = purpose;
    }

    get collection(): Map<string, GroupContract> {
        return this._collection;
    }

    private meetVoteThreshold(voteThreshold: string, ratio: number): boolean {
        // Test if voteThreshold is well-formed
        voteThreshold = voteThreshold.replace(/\s/g, ""); // remove whitespaces
        const regex = new RegExp("^(>|>=)\\d+/\\d+$");
        if (!regex.test(voteThreshold)) {
            throw new TypeError("The voteThreshold field is not well-formed");
        }

        let idx: number;
        let isBiggerOrEqual: boolean;
        if (voteThreshold.indexOf("=") > -1) {
            idx = voteThreshold.indexOf("=");
            isBiggerOrEqual = true;
        } else {
            idx = voteThreshold.indexOf(">");
            isBiggerOrEqual = false;
        }

        const fractionNumbers: number[] = voteThreshold.slice(idx + 1).split("/").map((f) => +f);
        const numericalVoteThreshold = fractionNumbers[0] / fractionNumbers[1];
        if (numericalVoteThreshold > 1.0) {
            throw new TypeError("The voteThreshold ratio needs to be between 0.0 and 1.0");
        } else if (numericalVoteThreshold === 1.0 && !isBiggerOrEqual) {
            // translate >1 to >=1 (because >1 makes no sense)
            isBiggerOrEqual = true;
        }

        if (isBiggerOrEqual) {
            return ratio >= numericalVoteThreshold;
        } else {
            return ratio > numericalVoteThreshold;
        }
    }

    private removeProposedGroupContract() {
        try {
            if (this._collection.size !== 0) {
                for (const gc of Array.from(this._collection.values())) {
                    // avoid to erase the genesis group contract
                    if (gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc)) {
                        this._collection.delete(gc.id);
                    }
                }
            }
        } catch (e) {
            throw e;
        }
    }
}
