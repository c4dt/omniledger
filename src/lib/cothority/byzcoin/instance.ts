import ByzCoinRPC from "./byzcoin-rpc";
import Proof from "./proof";
import {Properties} from "protobufjs";

export type InstanceID = Buffer;

/**
 * Instance with basic information
 */
export default class Instance {
    /**
     * Create an instance from a proof
     * @param p The proof
     * @returns the instance
     */
    static fromProof(key: InstanceID, p: Proof): Instance {
        if (!p.exists(key)) {
            throw new Error(`key not in proof: ${key.toString("hex")}`);
        }

        return Instance.fromFields(key, p.contractID, p.darcID, p.value);
    }

    /**
     * Create an instance after requesting its proof to byzcoin
     * @param rpc   The RPC to use
     * @param id    The ID of the instance
     * @returns the instance if it exists
     */
    static async fromByzCoin(rpc: ByzCoinRPC, id: InstanceID): Promise<Instance> {
        const p = await rpc.getProof(id);

        return Instance.fromProof(id, p);
    }

    /**
     * Creates a new instance from separated fields.
     * @param id
     * @param contractID
     * @param darcID
     * @param data
     */
    static fromFields(id: InstanceID, contractID: string, darcID: InstanceID, data: Buffer): Instance {
        return new Instance({id: id, contractID: contractID, darcID: darcID, data: data});
    }

    /**
     * Returns an instance from a previously toBytes() call.
     * @param buf
     */
    static fromBytes(buf: Buffer): Instance {
        let obj = JSON.parse(buf.toString());
        return new Instance({
            id: Buffer.from(obj.id),
            contractID: obj.contractID,
            darcID: Buffer.from(obj.darcID),
            data: Buffer.from(obj.data)
        });
    }

    public id: InstanceID;
    public contractID: string;
    public darcID: InstanceID;
    public data: Buffer;

    protected constructor(init: Properties<Instance> | Instance) {
        this.id = init.id;
        this.contractID = init.contractID;
        this.darcID = init.darcID;
        this.data = init.data;
    }

    /**
     * Returns a byte representation of the Instance.
     */
    toBytes(): Buffer {
        return Buffer.from(JSON.stringify(this));
    }
}
