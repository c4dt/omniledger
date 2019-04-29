import { createHash } from "crypto";
import Long from "long";
import { Message, Properties } from "protobufjs/light";
import { EMPTY_BUFFER, registerMessage } from "../protobuf";
import { IIdentity } from "./identity-wrapper";
import Rules from "./rules";

/**
 * Create a list of rules with basic permissions for owners and signers
 * @param owners those allow to evolve the darc
 * @param signers those allow to sign
 * @returns the list of rules
 */
function initRules(owners: IIdentity[], signers: IIdentity[]): Rules {
    const rules = new Rules();

    owners.forEach((o) => rules.appendToRule("invoke:darc.evolve", o, Rules.AND));
    signers.forEach((s) => rules.appendToRule(DarcInstance.commandSign, s, Rules.OR));

    return rules;
}

/**
 * Distributed Access Right Controls
 */
export default class Darc extends Message<Darc> {

    /**
     * Get the id of the darc
     * @returns the id as a buffer
     */
    get id(): Buffer {
        const h = createHash("sha256");
        const versionBuf = Buffer.from(this.version.toBytesLE());
        h.update(versionBuf);
        h.update(this.description);

        if (this.baseID.length > 0) {
            h.update(this.baseID);
        }
        if (this.prevID.length > 0) {
            h.update(this.prevID);
        }

        this.rules.list.forEach((r) => {
            h.update(r.action);
            h.update(r.expr);
        });

        return h.digest();
    }
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage("Darc", Darc, Rules);
    }

    /**
     * Create a genesis darc using the owners and signers to populate the
     * rules
     * @param owners    those you can evolve the darc
     * @param signers   those you can sign
     * @param desc      the description of the darc
     * @returns the new darc
     */
    static newDarc(owners: IIdentity[], signers: IIdentity[], desc?: Buffer, rules?: string[]): Darc {
        const darc = new Darc({
            baseID: Buffer.from([]),
            description: desc,
            prevID: createHash("sha256").digest(),
            rules: initRules(owners, signers),
            version: Long.fromNumber(0, true),
        });
        if (rules) {
            rules.forEach((r) => {
                signers.forEach((s) => {
                    darc.rules.appendToRule(r, s, "|");
                });
            });
        }

        return darc;
    }

    readonly version: Long;
    readonly description: Buffer;
    readonly baseID: Buffer;
    readonly prevID: Buffer;
    readonly rules: Rules;

    constructor(properties?: Properties<Darc>) {
        super(properties);

        this.description = Buffer.from(this.description || EMPTY_BUFFER);
        this.baseID = Buffer.from(this.baseID || EMPTY_BUFFER);
        this.prevID = Buffer.from(this.prevID || EMPTY_BUFFER);
        this.rules = this.rules || new Rules();

        /* Protobuf aliases */

        Object.defineProperty(this, "baseid", {
            get(): Buffer {
                return this.baseID;
            },
            set(value: Buffer) {
                this.baseID = value;
            },
        });

        Object.defineProperty(this, "previd", {
            get(): Buffer {
                return this.prevID;
            },
            set(value: Buffer) {
                this.prevID = value;
            },
        });
    }

    /**
     * Get the id of the genesis darc
     * @returns the id as a buffer
     */
    getBaseID(): Buffer {
        if (this.version.eq(0)) {
            return this.id;
        } else {
            return this.baseID;
        }
    }

    /**
     * Append an identity to a rule using the given operator when
     * it already exists
     * @param rule      the name of the rule
     * @param identity  the identity to append to the rule
     * @param op        the operator to use if necessary
     */
    addIdentity(rule: string, identity: IIdentity, op: string): void {
        this.rules.appendToRule(rule, identity, op);
    }

    /**
     * Copy and evolve the darc to the next version so that it can be
     * changed and proposed to byzcoin.
     * @returns a new darc
     */
    evolve(): Darc {
        return new Darc({
            baseID: this.getBaseID(),
            description: this.description,
            prevID: this.id,
            rules: this.rules.clone(),
            version: this.version.add(1),
        });
    }

    /**
     * Get a string representation of the darc
     * @returns the string representation
     */
    toString(): string {
        return "ID: " + this.id.toString("hex") + "\n" +
            "Base: " + this.baseID.toString("hex") + "\n" +
            "Prev: " + this.prevID.toString("hex") + "\n" +
            "Version: " + this.version + "\n" +
            "Rules: " + this.rules;
    }

    /**
     * Helper to encode the darc using protobuf
     * @returns encoded darc as a buffer
     */
    toBytes(): Buffer {
        return Buffer.from(Darc.encode(this).finish());
    }

    /**
     * Returns a deep copy of the darc.
     */
    copy(): Darc {
        return Darc.decode(this.toBytes());
    }
}

Darc.register();
