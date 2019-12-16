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

// GroupContract est un container qui gère tous les éléments
export class GroupContract {
    static createFromJSON(json: any): GroupContract {
        const groupDefinition = GroupDefinition.createFromJSON(json.groupDefinition);
        return new GroupContract(groupDefinition, json.signoffs);
    }

    static fromObject(gc: any) {
        const groupDefinition = GroupDefinition.fromObject(gc.groupDefinition);
        const groupContract = new GroupContract(groupDefinition, [...gc.signoff].map((s) => Buffer.from(s).toString()));
        groupContract.successor = [...gc.successor].map((s) => Buffer.from(s).toString());
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

    proposeGroupContract(newGroupDefinition: GroupDefinition): GroupContract {
        if (!newGroupDefinition.predecessor.includes(this._id)) {
            newGroupDefinition.predecessor.push(this._id);
        }

        const newGroupContract = new GroupContract(newGroupDefinition);
        this._successor.push(newGroupContract._id);
        return newGroupContract;
    }

    appendSignoff(signoff: string, p: GroupContract): boolean {
        // check the signoff
        if (!this._groupDefinition.verifySignoff(signoff, p.groupDefinition)) {
            return false;
        }

        this._signoffs.push(signoff);
        return true;
    }

    verify(...parent: GroupContract[]): boolean {
        if (this._id !== this.groupDefinition.getId()) {
            throw new TypeError("The group contract id is not valid.");
        }

        const arg = parent[0] ? parent.map((p) => p.groupDefinition) : [undefined];
        return this._groupDefinition.verify(this._signoffs, ...arg);
    }

    mergeSignoffs(groupContract: GroupContract) {
        if (this._id === groupContract._id) {
            const newSignoffs: string[] = groupContract._signoffs.filter((sig: string, idx: number) => {
                return this._signoffs.indexOf(sig) !== idx;
            });
            newSignoffs.forEach((sig: string) => this._signoffs.push(sig));
        }
    }

    toJSON(): IGroupContract {
        return {
            id: this._id,
            groupDefinition: this._groupDefinition.toJSON(),
            signoffs: this._signoffs,
            successor: this._successor,
        };
    }

    toObject(): object {
        return {
            id: this._id,
            groupDefinition: this._groupDefinition.toObject(),
            signoff: Buffer.from(this._signoffs),
            successor: Buffer.from(this._successor),
        }
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

    get suite(): Group {
        return this._groupDefinition.suiteGroup;
    }
}
