import { Group } from "@dedis/kyber";
import { GroupDefinition, IGroupDefinition } from "./groupDefinition";

export const ENCODING: BufferEncoding = "hex";

export interface IGroupContract {
    id: string;
    groupDefinition: IGroupDefinition;
    signoffs: string[];
    successor: string[];
}

/**
 * Class container representing a group contract
 * A group contract represents the fundamental aspects of the group for a user
 * GroupContract class is used by the GroupContractCollection class
 *
 * An instance of GroupContract can be initialized:
 * - using the constructor having as arguments an instance of GroupDefinition and
 *   an optional array of signoffs
 * - using the static method createFromJSON(json), given as argument an object having
 *   the structure of a JSON, creates an instance of GroupContract
 */
export class GroupContract {
    static createFromJSON(json: any): GroupContract {
        // check the JSON soundness
        if (!json.hasOwnProperty("groupDefinition")) {
            throw new Error("Property groupDefinition is missing from the JSON");
        } else if (!json.hasOwnProperty("signoffs")) {
            throw new Error("Property signoffs is missing from the JSON");
        }

        const groupDefinition = GroupDefinition.createFromJSON(json.groupDefinition);
        return new GroupContract(groupDefinition, json.signoffs);
    }

    static fromObject(gc: any): GroupContract {
        const groupDefinition = GroupDefinition.fromObject(gc.groupDefinition);
        const groupContract = new GroupContract(groupDefinition, gc.signoffs !== undefined ? gc.signoffs : []);
        if (gc.successor !== undefined) {
            groupContract.successor = gc.successor;
        }

        return groupContract;
    }

    readonly id: string;
    readonly groupDefinition: GroupDefinition;
    private _signoffs: string[];
    private _successor: string[];

    constructor(groupDefinition: GroupDefinition, signoffs = []) {
        this.groupDefinition = groupDefinition;
        this.id =  groupDefinition.getId();
        this._signoffs = [...signoffs];
        this._successor = [];
    }

    /**
     * Returns new group contract having as predecessor this
     *
     * @param newGroupDefinition group definition of the new proposed group contract
     * @returns {GroupContract} new proposed group contract
     */
    proposeGroupContract(newGroupDefinition: GroupDefinition): GroupContract {
        if (!newGroupDefinition.predecessor.includes(this.id)) {
            newGroupDefinition.predecessor.push(this.id);
        }

        const newGroupContract = new GroupContract(newGroupDefinition);
        this._successor.push(newGroupContract.id);
        return newGroupContract;
    }

    /**
     * Append signoff to the group contract
     *
     * @param signoff to append
     * @param predecessor used to verify the signoff
     */
    appendSignoff(signoff: string, predecessor: GroupContract): boolean {
        // check the signoff
        if (!this.groupDefinition.verifySignoff(signoff, predecessor.groupDefinition)) {
            return false;
        }

        this._signoffs.push(signoff);
        return true;
    }

    /**
     * Verify group contract
     *
     * @param parent used to verify the group contract
     */
    verify(...parent: GroupContract[]): boolean {
        if (this.id !== this.groupDefinition.getId()) {
            throw new TypeError("The group contract id is not valid.");
        }

        const arg = parent[0] ? parent.map((p) => p.groupDefinition) : [undefined];
        return this.groupDefinition.verify(this._signoffs, ...arg);
    }

    /**
     * Merge signoffs between two group contracts into this group contract
     *
     * @param groupContract
     */
    mergeSignoffs(groupContract: GroupContract) {
        if (this.id === groupContract.id) {
            groupContract.signoffs.forEach((s: string) => {
                if (this._signoffs.indexOf(s) === -1) {
                    this._signoffs.push(s);
                }
            });
        } else {
            throw new TypeError("The groupContract id is not valid.");
        }
    }

    toJSON(): IGroupContract {
        // tslint:disable: object-literal-sort-keys
        return {
            id: this.id,
            groupDefinition: this.groupDefinition.toJSON(),
            signoffs: this._signoffs,
            successor: this._successor,
        };
    }

    toObject(): object {
        return {
            id: this.id,
            groupDefinition: this.groupDefinition.toObject(),
            signoff: this._signoffs,
            successor: this._successor,
        };
    }

    get signoffs(): string[] {
        return this._signoffs;
    }

    get successor(): string[] {
        return this._successor;
    }

    set successor(s: string[]) {
        this._successor = s;
    }

    get publicKeys(): string[] {
        return this.groupDefinition.publicKeys;
    }

    get voteThreshold(): string {
        return this.groupDefinition.voteThreshold;
    }

    get predecessor(): string[] {
        return this.groupDefinition.predecessor;
    }

    get purpose(): string {
        return this.groupDefinition.purpose;
    }

    get suite(): Group {
        return this.groupDefinition.suiteGroup;
    }
}
