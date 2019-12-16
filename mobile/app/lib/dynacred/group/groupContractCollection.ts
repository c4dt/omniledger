// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { KeyPair, Private } from "../KeyPair";
import { GroupContract } from "./groupContract";
import { GroupDefinition } from "./groupDefinition";

export class GroupContractCollection {

    static fromObject(obj: any) {
        // TODO
        const gcCollection = new GroupContractCollection();
        Log.print(obj);
        if (obj.collection) {
            Object.keys(obj.collection).forEach((id) => {
                gcCollection._collection.set(id,
                    obj.collection[id].map((gc: any) => GroupContract.fromObject(gc)),
                );
            });
        }
        if (obj.currentGroupContract) {
            gcCollection.currentGroupContract = obj.currentGroupContract;
        }

        return gcCollection;
        // Log.print("bonjour");
    }

    private _collection: Map<string, GroupContract>; // key: contractID, value: GroupDefinition
    private _purpose: string;
    private currentGroupContract: GroupContract;

    constructor(purpose?: string) {
        this._collection = new Map();
        this._purpose = purpose ? purpose : undefined;
    }

    createGroupContract(parent: GroupContract, groupDefinition: GroupDefinition): GroupContract {
        let newGroupContract: GroupContract;
        if (parent) {
            newGroupContract = parent.proposeGroupContract(groupDefinition);
        } else {
            newGroupContract = new GroupContract(groupDefinition);
        }
        this.append(newGroupContract);

        return newGroupContract;
    }

    async scanNewGroupContract(kp: KeyPair) {
        // try {
        //     const result = await scan("{{ L('group.camera_text') }}");
        //     const groupContract = GroupContract.createFromJSON(JSON.parse(result.text));
        //
        //     // cannot accept a group contract where the user public key is not included
        //     if (groupContract.groupDefinition.publicKeys.indexOf(kp._public.toHex()) === -1) {
        //         throw new Error("This group contract does not contain your public key.");
        //     }
        //
        //     if (this.get(groupContract.id)) {
        //         // already existing group contract
        //         this.append(groupContract);
        //     } else {
        //         // not yet aware of this group contract
        //         const options = {
        //             title: "Do you want to accept this new group contract?",
        //             message: groupContract.groupDefinition.toString(),
        //             okButtonText: "Yes",
        //             cancelButtonText: "No",
        //         };
        //         dialogs.confirm(options).then((choice: boolean) => {
        //         if (choice) {
        //                 this._purpose = groupContract.groupDefinition.purpose;
        //                 this.append(groupContract);
        //                 this.sign(groupContract, kp._private);
        //             }
        //         });
        //     }
        //
        // } catch (e) {
        //     await msgFailed(e.toString(), "Error");
        // }
    }

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

    append(groupContract: GroupContract) {
        Log.print("a");
        // only proceed if the the groupContract is sound
        const parents = this.getParent(groupContract);
        Log.print("parents: ", parents);
        if (parents.length) {
            if (!groupContract.verify(...this.getParent(groupContract))) {
                Log.print("The group contract 1");
                throw new TypeError("The group contract verification failed.");
            }
        } else {
            if (!groupContract.verify(undefined)) {
                Log.print("The group contract 2");
                throw new TypeError("The group contract verification failed.");
            }
        }
        Log.print("b");
        // check if the id is not already there
        const existing: GroupContract[] = [];
        this._collection.forEach((gd: GroupContract) => {
            if (gd.id === groupContract.id) {
                existing.push(gd);
            }
        });
        Log.print("c");
        if (existing.length) {
            groupContract.mergeSignoffs(existing[0]);
            this._collection.set(groupContract.id, groupContract);
        } else {
            // there is a new proposed group contract; therefore, erase the current proposed group contract
            this.removeProposedGroupContract();

            this._collection.set(groupContract.id, groupContract);
        }
        Log.print("d");
        // if groupContract is accepted; therefore, it becomes the current group contract
        const numbPredecessor = groupContract.groupDefinition.predecessor.length;
        if (numbPredecessor === 0 || (numbPredecessor > 0 && this.isAccepted(groupContract))) {
            this.currentGroupContract = groupContract;
        }
        Log.print("e");
    }

    has(groupContract: GroupContract): boolean {
        return this._collection.has(groupContract.id);
    }

    get(id: string): GroupContract {
        return this._collection.get(id);
    }

    getCurrentGroupContract(publicKey: string): GroupContract {
        // TODO this method is wrong!!!!!!!!!!!
        // const eligibleContracts = Array.from(this.collection.values()).filter((c) => c.successor.length === 0);

        // // check the presence of the publicKey and a corresponding signature
        // for (const contract of eligibleContracts) {
        //     if (contract.publicKeys.indexOf(publicKey) > -1) {
        //         if (contract.signoffs.length) {
        //             const message: Buffer = Buffer.from(contract.id, ENCODING);
        //             const suite: Group = contract.suite;
        //             for (const sig of contract.signoffs) {
        //                 // TODO try to move all the crypto to groupDefinition
        //                 if (contract.groupDefinition.verifySignoffWithPublicKey(sig, publicKey, message)) {
        //                     // if (schnorr.verify(suite, publicKey.point, message, Buffer.from(sig, ENCODING))) {
        //                     return contract;
        //                 }
        //             }
        //         }
        //     }
        // }
        // return undefined;
        return this.currentGroupContract;
    }

    getProposedGroupContract(): GroupContract {
        for (const gc of Array.from(this._collection.values())) {
            // avoid returning the genesis group contract
            if (gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc)) {
                return gc;
            }
        }

        return undefined;
    }

    // returns [gd] if there is no child to gd
    // returns [[gd,gd2], [gd,gd3]] if there is two children to gd
    getWorldView(groupContract: GroupContract) {
        const children = this.getChildren(groupContract);
        if (!children.length) {
            return [groupContract];
        } else {
            return children.map((c: GroupContract) => {
                return [].concat(...[groupContract].concat(this.getWorldView(c)));
            });
        }
    }

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

    // delegation of trust
    isAccepted(groupContract: GroupContract): boolean {
        Log.print("isAccepted0");
        if (!groupContract.predecessor.length) {
            throw new TypeError("The groupContract has to have at least one predecessor");
        }
        Log.print("isAccepted1");
        // if groupDefinition is not included into the collection, append it
        if (!this.has(groupContract)) {
            this.append(groupContract);
        }
        Log.print("isAccepted2");
        const parent = this.getParent(groupContract);
        if (!groupContract.verify(...parent)) {
            return false;
        }
        Log.print("isAccepted3");
        Log.print("parent", parent);
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
        Log.print("isAccepted4");
        return verifiedParent.reduce((bool1, bool2) => bool1 && bool2);
    }

    toObject(): object {
        // TODO
        const obj = {
            collection: {} as any,
            currentGroupContract: this.currentGroupContract.toObject(),
            purpose: this._purpose,
        };
        this._collection.forEach((gc: GroupContract, id: string) => obj.collection[id] = gc.toObject());
        return obj;
    }

    get purpose(): string {
        return this._purpose;
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
        if (this._collection.size !== 0) {
            for (const gc of Array.from(this._collection.values())) {
                // avoid to erase the genesis group contract
                if (gc.groupDefinition.predecessor.length > 0 && !this.isAccepted(gc)) {
                    this._collection.delete(gc.id);
                }
            }
        }
    }
}
