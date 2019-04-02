import {Message, Properties} from "protobufjs/light";
import Signer from "../../darc/signer";
import {EMPTY_BUFFER, registerMessage} from "../../protobuf";
import ByzCoinRPC from "../byzcoin-rpc";
import ClientTransaction, {Argument, Instruction} from "../client-transaction";
import Instance, {InstanceID} from "../instance";
import {Point} from "@dedis/kyber";

export default class CredentialsInstance extends Instance {
    static readonly contractID = "credential";

    /**
     * Get an existing credential instance using its instance ID by fetching
     * the proof.
     * @param bc    the byzcoin RPC
     * @param iid   the instance ID
     */
    static async fromByzcoin(bc: ByzCoinRPC, iid: InstanceID): Promise<CredentialsInstance> {
        return new CredentialsInstance(bc, await Instance.fromByzCoin(bc, iid));
    }

    private rpc: ByzCoinRPC;
    private instance: Instance;
    public credential: CredentialStruct;

    constructor(bc: ByzCoinRPC, inst: Instance) {
        super(inst);
        if (inst.contractID != CredentialsInstance.contractID){
            throw new Error("not correct contract");
        }
        this.rpc = bc;
        this.instance = inst;
        this.credential = CredentialStruct.fromData(inst.data);
    }

    /**
     * Update the data of the crendetial instance by fetching the proof
     *
     * @returns a promise resolving with the instance on success, rejecting with
     * the error otherwise
     */
    async update(): Promise<CredentialsInstance> {
        this.instance = await Instance.fromByzCoin(this.rpc, this.instance.id);
        this.credential = CredentialStruct.fromData(this.instance.data);
        return this;
    }

    /**
     * Get a credential attribute
     *
     * @param credential    The name of the credential
     * @param attribute     The name of the attribute
     * @returns the value of the attribute if it exists, null otherwise
     */
    getAttribute(credential: string, attribute: string): Buffer {
        return this.credential.getAttribute(credential, attribute);
    }

    /**
     * Set or update a credential attribute locally. The new credential is not sent to
     * the blockchain, for this you need to call sendUpdate.
     *
     * @param owner         Signer to use for the transaction
     * @param credential    Name of the credential
     * @param attribute     Name of the attribute
     * @param value         The value to set
     * @returns a promise resolving when the transaction is in a block, or rejecting
     * for an error
     */
    async setAttribute(owner: Signer, credential: string, attribute: string, value: Buffer): Promise<any> {
        return this.credential.setAttribute(credential, attribute, value);
    }

    async sendUpdate(owner: Signer, newCred: CredentialStruct = null): Promise<CredentialsInstance> {
        if (newCred) {
            this.credential = newCred.copy();
        }
        const instr = Instruction.createInvoke(
            this.instance.id,
            CredentialsInstance.contractID,
            "update",
            [new Argument({name: "credential", value: this.credential.toBytes()})],
        );
        await instr.updateCounters(this.rpc, [owner]);

        const ctx = new ClientTransaction({instructions: [instr]});
        ctx.signWith([[owner]]);

        await this.rpc.sendTransactionAndWait(ctx);

        return this;
    }

    async recoverIdentity(pubKey: Point, signatures: RecoverySignature[]): Promise<any> {
        let sigBuf = Buffer.alloc(RecoverySignature.pubSig * signatures.length);
        signatures.forEach((s, i) => s.signature.copy(sigBuf, RecoverySignature.pubSig * i));
        let ctx = new ClientTransaction({
            instructions: [
                Instruction.createInvoke(
                    this.instance.id,
                    CredentialsInstance.contractID,
                    "recover",
                    [new Argument({name: "signatures", value: sigBuf}),
                        new Argument({name: "public", value: pubKey.toProto()})])
            ]
        });
        await this.rpc.sendTransactionAndWait(ctx);
    }
}

/**
 * Data of a credential instance. It contains none, one or multiple
 * credentials.
 */
export class CredentialStruct extends Message<CredentialStruct> {
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage("personhood.CredentialStruct", CredentialStruct, Credential);
    }

    /**
     * Returns a new CredentialStruct class
     * @param d
     */
    static fromData(d: Buffer): CredentialStruct {
        return CredentialStruct.decode(d);
    }

    readonly credentials: Credential[];

    constructor(properties?: Properties<CredentialStruct>) {
        super(properties);

        this.credentials = this.credentials.slice() || [];
    }

    /**
     * Get a credential attribute
     *
     * @param credential    The name of the credential
     * @param attribute     The name of the attribute
     * @returns the value of the attribute if it exists, null otherwise
     */
    getAttribute(credential: string, attribute: string): Buffer {
        const cred = this.credentials.find((c) => c.name === credential);
        if (!cred) {
            return null;
        }
        const att = cred.attributes.find((a) => a.name === attribute);
        if (!att) {
            return null;
        }
        return att.value;
    }

    /**
     * Set or update a credential attribute locally. The update is not sent to the blockchain.
     * For this you need to call CredentialInstance.sendUpdate().
     *
     * @param owner         Signer to use for the transaction
     * @param credential    Name of the credential
     * @param attribute     Name of the attribute
     * @param value         The value to set
     * @returns a promise resolving when the transaction is in a block, or rejecting
     * for an error
     */
    setAttribute(credential: string, attribute: string, value: Buffer) {
        let cred = this.credentials.find((c) => c.name === credential);
        if (!cred) {
            cred = new Credential({name: credential, attributes: [new Attribute({name: attribute, value})]});
            this.credentials.push(cred);
        } else {
            const idx = cred.attributes.findIndex((a) => a.name === attribute);
            const attr = new Attribute({name: attribute, value});
            if (idx === -1) {
                cred.attributes.push(attr);
            } else {
                cred.attributes[idx] = attr;
            }
        }
    }

    /**
     * Copy returns a new CredentialStruct with copies of all internal data.
     */
    copy(): CredentialStruct {
        return CredentialStruct.fromData(this.toBytes());
    }

    /**
     * Helper to encode the struct using protobuf
     * @returns encoded struct as a buffer
     */
    toBytes(): Buffer {
        return Buffer.from(CredentialStruct.encode(this).finish());
    }
}

/**
 * A credential has a given name used as a key and one or more attributes
 */
export class Credential extends Message<Credential> {
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage("personhood.Credential", Credential, Attribute);
    }

    static fromNameAttr(name: string, key: string, value: Buffer): Credential {
        return new Credential({name: name, attributes: [new Attribute({name: key, value: value})]})
    }

    readonly name: string;
    readonly attributes: Attribute[];

    constructor(props?: Properties<Credential>) {
        super(props);

        this.attributes = this.attributes.slice() || [];
    }
}

/**
 * Attribute of a credential
 */
export class Attribute extends Message<Attribute> {
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage("personhood.Attribute", Attribute);
    }

    readonly name: string;
    readonly value: Buffer;

    constructor(props?: Properties<Attribute>) {
        super(props);

        this.value = Buffer.from(this.value || EMPTY_BUFFER);
    }
}

export class RecoverySignature {
    static readonly sig = 64;
    static readonly pub = 32;
    static readonly credIID = 32;
    static readonly version = 8;
    static readonly pubSig = RecoverySignature.pub + RecoverySignature.sig;
    static readonly msgBuf = RecoverySignature.credIID + RecoverySignature.pub + RecoverySignature.version;

    constructor(public credentialIID: InstanceID, public signature: Buffer) {
    }
}

CredentialStruct.register();
Credential.register();
Attribute.register();
