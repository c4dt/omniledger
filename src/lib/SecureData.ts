import { randomBytes } from "crypto";
import { ByzCoinRPC, InstanceID } from "@c4dt/cothority/byzcoin";
import CoinInstance from "@c4dt/cothority/byzcoin/contracts/coin-instance";
import DarcInstance from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import SpawnerInstance from "@c4dt/cothority/byzcoin/contracts/spawner-instance";
import { CalypsoReadInstance, CalypsoWriteInstance } from "@c4dt/cothority/calypso/calypso-instance";
import { LongTermSecret, OnChainSecretRPC } from "@c4dt/cothority/calypso/calypso-rpc";
import { IdentityDarc, IIdentity } from "@c4dt/cothority/darc";
import Signer from "@c4dt/cothority/darc/signer";
import { Log } from "@c4dt/cothority/log";
import { secretbox, secretbox_open } from "tweetnacl-ts";
import { Contact } from "./Contact";
import { KeyPair } from "./KeyPair";

/**
 * SecureData holds a decrypted secret, together with the writeID and the symmetric key, so that if
 * the secret is updated, the update can be decrypted, too.
 * Of course this data is sensible and should only be stored in clear locally. This data is also used
 * for storing 'other' data, but then it is stored as a secret itself in a CalypsoWriteInstance.
 */
export class SecureData {

    static fromObject(o: any): SecureData {
        return new SecureData(Buffer.from(o.writeInstID),
            Buffer.from(o.symKey),
            Buffer.from(o.plainData));
    }

    static fromBuffer(b: Buffer): SecureData {
        return SecureData.fromObject(JSON.parse(b.toString()));
    }

    /**
     * fromContact searches all secure data from the contact and checks whether the read has access to any of it.
     * It returns the array of all SecureData that the reader has access to.
     *
     * @param bc a valid ByzCoin instance
     * @param ocs a valid OnChainSecrets instance
     * @param c the contact holding the secure credentials
     * @param reader who is allowed to read, already in "(darc|ed25519):hex_value" expression
     * @param signers signers of a device needed to authenticate as the reader
     * @param coin eventual coin if CalypsoRead has a cost
     * @param coinSigners the signers to spend coins
     */
    static async fromContact(bc: ByzCoinRPC, ocs: OnChainSecretRPC, c: Contact, reader: IIdentity, signers: Signer[],
                             coin?: CoinInstance, coinSigners?: Signer[]): Promise<SecureData[]> {
        const sds: SecureData[] = [];
        await c.update();
        const cred = c.credential.getCredential("1-secret");
        if (cred) {
            for (const sdBuf of cred.attributes) {
                if (sdBuf.name !== "others") {
                    Log.lvl2("Checking secure data", sdBuf.name);
                    try {
                        const calWrite = await CalypsoWriteInstance.fromByzcoin(bc, sdBuf.value);
                        const cwDarc = await DarcInstance.fromByzcoin(bc, calWrite.darcID);
                        if (await cwDarc.ruleMatch("spawn:" + CalypsoReadInstance.contractID, [reader])) {
                            sds.push(await SecureData.fromWrite(bc, ocs, calWrite, signers, coin, coinSigners));
                        }
                    } catch (e) {
                        Log.catch(e, "Couldn't read calypso read of", sdBuf.name);
                    }
                } else {
                    Log.lvl2('Not checking "others" data');
                }
            }
        }
        return sds;
    }

    /**
     * fromWrite supposes that the given write instance is readable by the signers. It
     * requests a CalypsoRead and uses this to decrypt the symmetric key.
     *
     * @param bc a valid ByzCoin instance
     * @param wrID the CalypsoWriteID where the signers have access
     * @param signers the set of signers needed to spawn a read instance
     */
    static async fromWrite(bc: ByzCoinRPC, ocs: OnChainSecretRPC, calypsoWrite: CalypsoWriteInstance, signers: Signer[],
                           coin?: CoinInstance, coinSigners?: Signer[]): Promise<SecureData> {
        Log.lvl1("Creating calypsoRead for data");
        const ephemeral = new KeyPair();
        const cr = await calypsoWrite.spawnRead(ephemeral._public.point, signers, coin, coinSigners);
        const symKeyPart = await cr.decrypt(ocs, ephemeral._private.scalar);
        const nonce = calypsoWrite.write.data.slice(0, 24);
        const symKey = Buffer.concat([symKeyPart, calypsoWrite.write.data.slice(24, 28)]);
        const data = secretbox_open(calypsoWrite.write.data.slice(28), nonce, symKey);
        return new SecureData(calypsoWrite.id, symKey, Buffer.from(data));
    }

    /**
     * spawnFromSpawner creates a new CalypsoWrite with the given data. The read-
     * rights must include the creator of the write instance, else other devices
     * will not be able to access it.
     *
     * @param bc a working ByzCoin instance
     * @param ocs an OCS instance where the byzcoin-id is accepted
     * @param data what to store encrypted in ByzCoin
     * @param readers signer-darc IDs of who is allowed to read - should include the creator
     * @param spawner which accepts the coins to create new instances
     * @param coin an account with enough coins to create the darc and writeInstance needed
     * @param signers to spend the coins
     */
    static async spawnFromSpawner(bc: ByzCoinRPC, lts: LongTermSecret, data: Buffer, readers: InstanceID[],
                                  spawner: SpawnerInstance,
                                  coin: CoinInstance, signers: Signer[]): Promise<SecureData> {
        const symKey = randomBytes(32);
        const nonce = randomBytes(24);
        const encData = secretbox(data, nonce, symKey);

        // This is kind of stupid, but needed: currently we can only encrypt 28 bytes using Calypso, so
        // we need to put the remaining 4 bytes in clear text! Which reduces the security of the encryption
        // to 28*8 = 208 bits.
        const calypsoData = Buffer.concat([nonce, symKey.slice(28), Buffer.from(encData)]);
        const ids = readers.map((r) => new IdentityDarc({id: r}));
        const calypsoWrite = await spawner.spawnCalypsoWrite(coin, signers, lts,
            symKey.slice(0, 28), ids, calypsoData);
        return new SecureData(calypsoWrite.id, symKey, data);
    }
    constructor(public writeInstID: InstanceID, public symKey: Buffer, public plainData: Buffer) {
    }

    toObject(): object {
        return {
            plainData: this.plainData,
            symKey: this.symKey,
            writeInstID: this.writeInstID,
        };
    }

    toBuffer(): Buffer {
        return Buffer.from(JSON.stringify(this.toObject()));
    }
}

/**
 * FileBlob holds one data-structure including meta-data like name, type, date.
 */
export class FileBlob {

    static fromBuffer(b: Buffer): FileBlob {
        const fbObj: any = JSON.parse(b.toString());
        return new FileBlob(fbObj.name, Buffer.from(fbObj.data), fbObj.attributes);
    }
    constructor(public name: string, public data: Buffer, public attributes: IFBAttribute[] = null) {
    }

    toBuffer(): Buffer {
        return Buffer.from(JSON.stringify(this));
    }
}

export interface IFBAttribute {
    name: string;
    value: string;
}
