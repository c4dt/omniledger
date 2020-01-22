import { Private } from "../KeyPair";
import { GroupContract } from "./groupContract";
import { GroupDefinition } from "./groupDefinition";

/**
 * Class collecting group contracts from the same group
 */
export class GroupContractCollection {

    static fromObject(obj: any): GroupContractCollection {
        const gcCollection = new GroupContractCollection();

        if (obj.collection !== undefined) {
            Object.keys(obj.collection).forEach((id) => {
                gcCollection._collection.set(id,
                    GroupContract.fromObject(obj.collection[id]),
                    // TODO to test
                    // obj.collection[id].map((gc: any) => GroupContract.fromObject(gc)),
                );
            });
        }

        if (obj.currentGroupContract !== undefined) {
            gcCollection.currentGroupContract = GroupContract.fromObject(obj.currentGroupContract);
        }

        if (obj._purpose !== undefined) {
            gcCollection.purpose = obj._purpose;
        }

        return gcCollection;
    }

    private _collection: Map<string, GroupContract>; // key: contractID, value: GroupContract
    // private _purpose: string | undefined;
    // TODO to test
    private currentGroupContract: GroupContract | undefined;

    constructor(public purpose?: string | undefined) {
        this._collection = new Map();
    }

    /**
     * Create new group contract and append it to the collection
     *
     * @param parent new group contract's predecessor
     * @param groupDefinition new group contract's group definition
     * @returns {GroupContract} new group contract
     */
    createGroupContract(parent: GroupContract | undefined, groupDefinition: GroupDefinition): GroupContract {
        let newGroupContract: GroupContract;
        if (parent !== undefined) {
            newGroupContract = parent.proposeGroupContract(groupDefinition);
        } else {
            newGroupContract = new GroupContract(groupDefinition);
        }
        this.append(newGroupContract);

        return newGroupContract;
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
    }

    /**
     * Append a group contract to this collection if it is well-formed and
     * set it as current group contract if it is the case
     *
     * @param groupContract
     * @param keepOnly if true do not make the group contract the current one
     */
    append(groupContract: GroupContract, keepOnly: boolean = false) {
        // only proceed if the the groupContract is sound
        const parents = this.getParent(groupContract);
        if (parents.length > 0) {
            if (!groupContract.verify(...this.getParent(groupContract))) {
                throw new Error("The group contract verification failed.");
            }
        } else {
            if (!groupContract.verify()) {
                throw new Error("The group contract verification failed.");
            }
        }

        // check if the id is not already there
        const existing: GroupContract | undefined = this._collection.get(groupContract.id);
        // TODO to test

        if (existing !== undefined) {
            groupContract.mergeSignoffs(existing);
        } else {
            // there is a new proposed group contract; therefore, erase the current proposed group contract
            this.removeProposedGroupContract();
        }

        this._collection.set(groupContract.id, groupContract);

        // if groupContract is accepted; therefore, it becomes the current group contract
        const numbPredecessor = groupContract.groupDefinition.predecessor.length;
        if (!keepOnly && (numbPredecessor === 0 || (numbPredecessor > 0 && this.isAccepted(groupContract)))) {
            this.currentGroupContract = groupContract;
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

    getProposedGroupContract(): GroupContract | undefined {
        return Array.from(this._collection.values())
            .filter((gc: GroupContract) => gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc))
            .reduce((_, cur) => cur, undefined);
        // TODO to test
        // for (const gc of Array.from(this._collection.values())) {
        //     // avoid returning the genesis group contract
        //     if (gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc)) {
        //         return gc;
        //     }
        // }

        // return undefined;
    }

    /**
     * Get worldview from a specific group contract
     *
     * @param groupContract
     * @returns an array of direct successor(s)
     */
    getWorldView(groupContract: GroupContract): GroupContract[] {
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
        return groupContract.predecessor.map((id: string) => this._collection.get(id));
    }

    getChildren(groupContract: GroupContract): GroupContract[] {
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
        if (groupContract.predecessor.length === 0) {
            throw new Error("The groupContract has to have at least one predecessor");
        }

        // if groupDefinition is not included into the collection, append it
        if (!this.has(groupContract)) {
            this.append(groupContract, true);
        }

        const parent = this.getParent(groupContract);
        if (!groupContract.verify(...parent)) {
            return false;
        }
        return parent.map((p: GroupContract) => {
            // we count the number of signoffs for a specific parent because
            // when there is multiple parent each parent vote threshold need to be reached
            // by the organizers in the parent (not all the organizers of the current group)
            const numbSignoffsByParent = groupContract.signoffs
                .filter((s: string) => groupContract.groupDefinition.verifySignoff(s, p.groupDefinition))
                .length;
            // TODO to test
            // let numbSignoffsByParent = 0;
            // for (const s of groupContract.signoffs) {
            //     if (groupContract.groupDefinition.verifySignoff(s, p.groupDefinition)) {
            //         numbSignoffsByParent++;
            //     }
            // }

            return this.meetVoteThreshold(p.voteThreshold, numbSignoffsByParent / p.publicKeys.length);
        })
            .reduce((bool1, bool2) => bool1 && bool2);

    }

    toObject(): any {
        const obj = {
            // collection: {} as any,
            // TODO to test
            collection: Array.from(this._collection).reduce((acc, entry) => acc[entry[0]] = entry[1].toObject(), {}),
            currentGroupContract: this.currentGroupContract ? this.currentGroupContract.toObject() : undefined,
            purpose: this.purpose,
        };
        // this._collection.forEach((gc: GroupContract, id: string) => obj.collection[id] = gc.toObject());
        return obj;
    }

    get collection(): Map<string, GroupContract> {
        return new Map(this._collection);
        // return this._collection;
        // TODO to test
    }

    /**
     * Remove the proposed group contract if it exists
     *
     */
    removeProposedGroupContract() {
        // return Array.from(this._collection.values())
        // .filter(gc => gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc))
        // .reduce((_, cur) => cur, undefined);
        if (this._collection.size !== 0) {
            this._collection = Array.from(this._collection)
                .filter(([_, gc]) => gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc))
                .reduce((acc: Map<string, GroupContract>, item) => acc.set(item[0], item[1]), new Map());
            // TODO to test
            // for (const gc of Array.from(this._collection.values())) {
            //     // avoid to erase the genesis group contract
            //     if (gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc)) {
            //         this._collection.delete(gc.id);
            //     }
            // }
        }
    }

    private meetVoteThreshold(voteThreshold: string, ratio: number): boolean {
        // Test if voteThreshold is well-formed
        voteThreshold = voteThreshold.replace(/\s/g, ""); // remove whitespaces
        const regex = new RegExp("^>=?\\d+/\\d+$");
        if (!regex.test(voteThreshold)) {
            throw new Error("The voteThreshold field is not well-formed");
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

        const fractionNumbers: number[] = voteThreshold.slice(idx + 1).split("/").map((f) => Number.parseFloat(f));
        const numericalVoteThreshold = fractionNumbers[0] / fractionNumbers[1];
        if (numericalVoteThreshold > 1.0) {
            throw new Error("The voteThreshold ratio needs to be between 0.0 and 1.0");
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
}
