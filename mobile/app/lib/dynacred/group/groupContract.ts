// tslint:disable-next-line
require("nativescript-nodeify");

import { Group } from "@dedis/kyber";
import { GroupDefinition, IGroupDefinition } from "./groupDefinition";

export const ENCODING: string = "hex";

export interface IGroupContract {
    id: string;
    groupDefinition: IGroupDefinition;
    signoffs: string[];
    successor: string[];
}

/**
 * Class container representing a group contract
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

    static fromObject(gc: any) {
        const groupDefinition = GroupDefinition.fromObject(gc.groupDefinition);
        const groupContract = new GroupContract(groupDefinition, gc.signoffs ? gc.signoffs : []);
        if (gc.successor) {
            groupContract.successor = gc.successor;
        }

        return groupContract;
    }

    private _id: string;
    private _groupDefinition: GroupDefinition;
    private _signoffs: string[];
    private _successor: string[];

    constructor(groupDefinition: GroupDefinition, signoffs = []) {
        this._groupDefinition = groupDefinition;
        this._id =  groupDefinition.getId();
        this._signoffs = signoffs;
        this._successor = [];
    }

    /**
     * Returns new group contract having as predecessor this
     *
     * @param newGroupDefinition group definition of the new proposed group contract
     * @returns {GroupContract} new proposed group contract
     */
    proposeGroupContract(newGroupDefinition: GroupDefinition): GroupContract {
        if (!newGroupDefinition.predecessor.includes(this._id)) {
            newGroupDefinition.predecessor.push(this._id);
        }

        const newGroupContract = new GroupContract(newGroupDefinition);
        this._successor.push(newGroupContract._id);
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
        if (!this._groupDefinition.verifySignoff(signoff, predecessor.groupDefinition)) {
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
        if (this._id !== this.groupDefinition.getId()) {
            throw new TypeError("The group contract id is not valid.");
        }

        const arg = parent[0] ? parent.map((p) => p.groupDefinition) : [undefined];
        return this._groupDefinition.verify(this._signoffs, ...arg);
    }

    /**
     * Merge signoffs between two group contracts into this group contract
     *
     * @param groupContract
     */
    mergeSignoffs(groupContract: GroupContract) {
        if (this._id === groupContract._id) {
            const newSignoffs: string[] = groupContract._signoffs.filter((sig: string, idx: number) => {
                return this._signoffs.indexOf(sig) !== idx;
            });
            newSignoffs.forEach((sig: string) => this._signoffs.push(sig));
        }
    }

    toJSON(): IGroupContract {
        // tslint:disable: object-literal-sort-keys
        return {
            id: this._id,
            groupDefinition: this._groupDefinition.toJSON(),
            signoffs: this._signoffs,
            successor: this._successor,
        };
    }

    toObject(): object {
        // tslint:disable: object-literal-sort-keys
        return {
            id: this._id,
            groupDefinition: this._groupDefinition.toObject(),
            signoff: this._signoffs,
            successor: this._successor,
        };
    }

    get id(): string {
        return this._id;
    }

    get groupDefinition(): GroupDefinition {
        return this._groupDefinition;
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
        return this._groupDefinition.publicKeys;
    }

    get voteThreshold(): string {
        return this._groupDefinition.voteThreshold;
    }

    get predecessor(): string[] {
        return this._groupDefinition.predecessor;
    }

    get purpose(): string {
        return this._groupDefinition.purpose;
    }

    get suite(): Group {
        return this._groupDefinition.suiteGroup;
    }
}
