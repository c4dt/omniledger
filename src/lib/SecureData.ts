import {randomBytes} from 'crypto';
import {Contact} from './Contact';
import {ByzCoinRPC, InstanceID} from './cothority/byzcoin';
import {Log} from './cothority/log';
import {CalypsoReadInstance, CalypsoWriteInstance, Write} from './cothority/calypso/calypso-instance';
import DarcInstance from './cothority/byzcoin/contracts/darc-instance';
import {KeyPair} from './KeyPair';
import Signer from './cothority/darc/signer';
import CoinInstance from './cothority/byzcoin/contracts/coin-instance';
import OnChainSecretRPC from './cothority/calypso/calypso-rpc';
import {secretbox} from 'tweetnacl-ts';
import SpawnerInstance from './cothority/byzcoin/contracts/spawner-instance';
import {Point} from '../../../cothority/external/js/kyber/dist';

export class SecureData {
    constructor(public writeInstID: InstanceID, public symKey: Buffer, public encData: Buffer) {
    }

    /**
     * fromContact searches all secure data from the contact and checks whether the read has access to any of it.
     * It returns the array of all SecureData that the reader has access to.
     *
     * @param bc a valid ByzCoin instance
     * @param ocs a valid OnChainSecrets instance
     * @param c the contact holding the secure credentials
     * @param reader who is allowed to read
     * @param signers signers of a device needed to authenticate as the reader
     * @param coin eventual coin if CalypsoRead has a cost
     * @param coinSigners the signers to spend coins
     */
    static async fromContact(bc: ByzCoinRPC, ocs: OnChainSecretRPC, c: Contact, reader: InstanceID, signers: Signer[],
                             coin?: CoinInstance, coinSigners?: Signer[]): Promise<SecureData[]> {
        const sds: SecureData[] = [];
        const cred = c.credential.getCredential('1-secure');
        if (cred) {
            for (const sd of cred.attributes) {
                Log.lvl2('Checking secure data', sd.name);
                try {
                    const calWrite = await CalypsoWriteInstance.fromByzcoin(bc, sd.value);
                    const cwDarc = await DarcInstance.fromByzcoin(bc, calWrite.darcID);
                    const readersRule = cwDarc.darc.rules.getRule('spawn:' + CalypsoReadInstance.contractID).expr.toString();
                    if (readersRule.indexOf('&') >= 0) {
                        Log.warn('Cannot parse AND rules yet');
                        continue;
                    }
                    const readers = readersRule.split('|');
                    const readerHex = reader.toString('hex');
                    if (readers.find(r => r.trim() === readerHex)) {
                        sds.push(await SecureData.fromWrite(bc, ocs, calWrite, signers, coin, coinSigners));
                    }
                } catch (e) {
                    Log.warn('Couldn\'t read calypso write of', sd.name);
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
        const ephemeral = new KeyPair();
        const cr = await calypsoWrite.spawnRead(ephemeral._public.point, signers, coin, coinSigners);
        const symKey = await cr.decrypt(ocs, ephemeral._private.scalar);
        return new SecureData(calypsoWrite.id, symKey, calypsoWrite.data);
    }


    static async spawnFromSpawner(bc: ByzCoinRPC, ocs: OnChainSecretRPC, data: Buffer, spawner: SpawnerInstance,
                                  coin: CoinInstance, signers: Signer[]): Promise<SecureData> {
        const symKey = randomBytes(32);
        const nonce = randomBytes(24);
        const encData = secretbox(data, nonce, symKey);

        // This is kind of stupid, but needed: currently we can only encrypt 28 bytes using Calypso, so
        // we need to put the remaining 4 bytes in clear text! Which reduces the security of the encryption
        // to 28*8 = 208 bits.
        const calypsoData = Buffer.concat([nonce, Buffer.from(symKey.subarray(28)), Buffer.from(encData)]);
        const darcID = null;
        let X: Point;
        const write = Write.createWrite(ocs.id, darcID, X, Buffer.from(symKey.subarray(0, 28)));
        const calypsoWrite = await CalypsoWriteInstance.spawn(bc, darcID, write, signers);
        return null;
    }

    toObject(): object {
        return {};
    }
}
