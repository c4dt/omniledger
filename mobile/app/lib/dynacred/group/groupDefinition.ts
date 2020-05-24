import { curve, Group, Point } from "@dedis/kyber";
import { schnorr } from "@dedis/kyber/sign";
import crypto from "crypto-browserify";
import { Private, Public } from "../KeyPair";
import { ENCODING } from "./groupContract";

// variables of a GroupDefinition
export interface IGroupDefinition {
    orgPubKeys: string[];
    suite: string;
    voteThreshold: string;
    purpose: string;
    predecessor?: string[];
}

/**
 * Class representing a group definition
 * A group definition defines the structure of a group of organizers
 * It is one variable of the GroupContract class
 *
 * An instance of GroupDefinition can be initialized:
 * - using the constructor having as arguments an object of type IGroupDefinition
 * - using the static method createFromJSON(json), given as argument an object having
 *   the structure of a JSON, creates an instance of GroupDefinition
 */
export class GroupDefinition {

    static createFromJSON(json: IGroupDefinition): GroupDefinition {
        // check the JSON soundness
        if (!json.hasOwnProperty("orgPubKeys")) {
            throw new Error("Property orgPubKeys is missing from the JSON");
        } else if (!json.hasOwnProperty("voteThreshold")) {
            throw new Error("Property voteThreshold is missing from the JSON");
        } else if (!json.hasOwnProperty("purpose")) {
            throw new Error("Property purpose is missing from the JSON");
        } else if (!json.hasOwnProperty("suite")) {
            throw new Error("Property suite is missing from the JSON");
        }

        const jsonObject: IGroupDefinition = {
            orgPubKeys: json.orgPubKeys,
            predecessor: json.predecessor ? json.predecessor : [],
            purpose: json.purpose,
            suite: json.suite,
            voteThreshold: json.voteThreshold,
        };

        return new GroupDefinition(jsonObject);
    }

    static fromObject(gd: any): GroupDefinition {
        const variables: IGroupDefinition = {
            orgPubKeys: gd.orgPubKeys,
            predecessor: gd.predecessor !== undefined ? gd.predecessor : [],
            purpose: gd.purpose,
            suite: gd.suite,
            voteThreshold: gd.voteThreshold,
        };
        return new GroupDefinition(variables);
    }

    /**
     * Utility method which returns the Group corresponding to a suite string description
     *
     * @param suite
     */
    private static getGroup(suite: string): Group {
        switch (suite) {
            case "edwards25519":
                return curve.newCurve("edwards25519");
            default:
                throw new Error("For the time being, only the edwards25519 is supported.");
        }
    }

    constructor(private variables: IGroupDefinition) {
        if (!this.variables.predecessor) {
            this.variables.predecessor = [];
        }
    }

    /**
     * Sign the group definition id
     *
     * @param privateKey
     * @returns {string} signature
     */
    sign(privateKey: Private): string {
        const message: Buffer = Buffer.from(this.getId(), ENCODING);
        return schnorr.sign(this.suiteGroup, privateKey.scalar, message).toString(ENCODING);
    }

    /**
     * Verify the soundness of the group definition
     * Beware: do not verify if the threshold has been reached
     *
     * @param signoffs
     * @param parent
     * @returns {boolean} if verification process true, otherwise false
     */
    verify(signoffs: string[], ...parent: GroupDefinition[]): boolean {
        if (!parent.map((p) => this.verifyId(p)).every((_) => _)) {
            return false;
        }

        // Verify signoffs
        const publicKeys = parent[0]
            ? [].concat(...parent.map((p) => p.publicKeys)).filter((val, idx, self) => {
                return self.indexOf(val) === idx;
            })
            : [...this.publicKeys];
        const id = this.getId();
        // verify that every signoff correspond to one and only one parent public key
        if (signoffs.length) {
            const message: Buffer = Buffer.from(id, ENCODING);

            // false if there is some wrong signature (duplicate or from an unknown public key)
            return signoffs.every((s: string) => {
                for (const publicKey of publicKeys) {
                    if (this.verifySignoffWithPublicKey(s, publicKey, message)) {
                        publicKeys.splice(publicKeys.indexOf(publicKey), 1);
                        return true;
                    }
                }
                return false;
            });
        }

        return true;
    }

    /**
     * Verify soundness of a specific signoff
     *
     * @param signoff
     * @param parent
     * @param parentSignoffs optional variable provided when counting the signoffs of a merge
     * @returns {boolean}
     */
    verifySignoff(signoff: string, parent: GroupDefinition): boolean {
        if (!this.verifyId(parent)) {
            return false;
        }

        // check the signoff
        const message: Buffer = Buffer.from(this.getId(), ENCODING);
        for (const publicKey of parent.publicKeys) {
            if (this.verifySignoffWithPublicKey(signoff, publicKey, message)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verify soundness of a specifc signoff with a specific public key
     *
     * @param signoff
     * @param publicKey
     * @param message source of the signature
     * @returns {boolean}
     */
    verifySignoffWithPublicKey(signoff: string, publicKey: string, message: Buffer): boolean {
        const point: Point = Public.fromHex(publicKey).point;
        return schnorr.verify(this.suiteGroup, point, message, Buffer.from(signoff, ENCODING));
    }

    /**
     * Test the similarity between two group definitions
     *
     * @param groupDefinition
     * @returns {boolean} true if similar, otherwise false
     */
    isSimilarTo(groupDefinition: GroupDefinition): boolean {
        let similarPublicKeys = this.variables.orgPubKeys.length === groupDefinition.publicKeys.length;

        // if the two arrays have the same size, then compare if they have the same values
        if (similarPublicKeys) {
            similarPublicKeys = this.variables.orgPubKeys.every((pk) => groupDefinition.publicKeys.includes(pk)) &&
                groupDefinition.publicKeys.every((pk) => this.variables.orgPubKeys.includes(pk));
        }

        return similarPublicKeys
            && (this.variables.purpose === groupDefinition.purpose)
            && (this.variables.suite === groupDefinition.suite)
            && (this.variables.voteThreshold === groupDefinition.voteThreshold);
    }

    toJSON(): IGroupDefinition {
        return {
            orgPubKeys: this.variables.orgPubKeys,
            predecessor: this.variables.predecessor,
            purpose: this.variables.purpose,
            suite: this.variables.suite,
            voteThreshold: this.variables.voteThreshold,
        };
    }

    toObject(): object {
        return {
            orgPubKeys: this.variables.orgPubKeys,
            predecessor: this.variables.predecessor,
            purpose: this.variables.purpose,
            suite: this.variables.suite,
            voteThreshold: this.variables.voteThreshold,
        };
    }

    toString(): string {
        return "public keys: " + this.variables.orgPubKeys + "\n"
            + "suite: " + this.variables.suite + "\n"
            + "vote threshold: " + this.variables.voteThreshold + "\n"
            + "purpose: " + this.variables.purpose + "\n"
            + (this.predecessor.length > 0 ? "predecessor: " + this.variables.predecessor : "");
    }

    /**
     *
     * @returns {string} id string representation
     */
    getId(): string {
        const hashContext = crypto.createHash("sha256");
        this.publicKeys.forEach((pk: string) => hashContext.update(Buffer.from(pk, ENCODING)));
        hashContext.update(Buffer.from(this.suite));
        hashContext.update(Buffer.from(this.voteThreshold));
        hashContext.update(Buffer.from(this.purpose));
        if (this.predecessor) {
            this.predecessor.forEach((p: string) => hashContext.update(Buffer.from(p, ENCODING)));
        }
        return hashContext.digest().toString(ENCODING);
    }

    get publicKeys(): string[] {
        return this.variables.orgPubKeys;
    }

    get numbOrganizers(): number {
        return this.variables.orgPubKeys.length;
    }

    get suite(): string {
        return this.variables.suite;
    }

    get suiteGroup(): Group {
        return GroupDefinition.getGroup(this.variables.suite);
    }

    get voteThreshold(): string {
        return this.variables.voteThreshold;
    }

    get purpose(): string {
        return this.variables.purpose;
    }

    get predecessor(): string[] {
        return this.variables.predecessor;
    }

    get allVariables(): IGroupDefinition {
        // Deep copy of the object variables
        return {
            orgPubKeys: [...this.variables.orgPubKeys],
            predecessor: [...this.variables.predecessor],
            purpose: this.variables.purpose,
            suite: this.variables.suite,
            voteThreshold: this.variables.voteThreshold,
        };
    }

    private verifyId(parent?: GroupDefinition): boolean {
        if (parent === undefined) {
            return true;
        }

        return this.predecessor.find((p) => p === parent.getId()) !== undefined;
    }
}
