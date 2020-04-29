import {CredentialInstanceMapBS} from "./credentialStructBS";
import {CredentialTransaction} from "./credentialTransaction";
import {Instance, InstanceID} from "@dedis/cothority/byzcoin";
import {CalypsoReadInstance, CalypsoWriteInstance, LongTermSecret, Write} from "@dedis/cothority/calypso";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";
import {IdentityWrapper} from "@dedis/cothority/darc";
import {KeyPair} from "./keypair";
import {createCipheriv, randomBytes} from "crypto-browserify";
import {createDecipheriv} from "crypto";
import {Point} from "@dedis/kyber/index";

// Copied from webapp/lib/UI.ts - should probably be merged in CredentialTransaction and then be used
// in showTransactions - which should also be revamped. But that is for later...
export type TProgress = (percentage: number, text: string) => void;

export class Calypso {
    constructor(
        public lts: LongTermSecret,
        private signerID: InstanceID,
        public cim: CredentialInstanceMapBS) {
    }

    addFile(tx: CredentialTransaction, darcID: InstanceID, name: string, data: Buffer): InstanceID {
        if (this.cim.hasEntry(Buffer.from(name))) {
            throw new Error("cannot add file with existing name");
        }

        const wr = CalypsoData.encrypt(this.lts, darcID, data);
        const wrID = tx.spawnCalypsoWrite(darcID, wr);
        this.cim.setEntry(tx, name, wrID);
        return wrID;
    }

    rmFile(tx: CredentialTransaction, name: string) {
        const wrID = this.cim.getValue().toKVs()
            .find(kv => kv.value === name);
        if (!wrID) {
            throw new Error("this write-ID doesn't exist");
        }
        tx.delete(wrID.key, CalypsoWriteInstance.contractID);
        this.cim.rmEntry(tx, wrID.key);
    }

    async getFile(tx: CredentialTransaction, wrID: Buffer, kp: KeyPair, p?: TProgress): Promise<Buffer> {
        if (p){
            p(50, "Decryption Request");
        }
        const rdID = tx.spawnCalypsoRead(wrID, kp.pub);
        await tx.sendCoins(10);

        if (p){
            p(-75, "Collective Re-Encryption");
        }
        const wrProof = await this.lts.bc.getProof(wrID);
        const rdProof = await this.lts.bc.getProof(rdID);
        const xhatenc = await this.lts.reencryptKey(
            wrProof,
            rdProof,
        );

        const key = await xhatenc.decrypt(kp.priv);
        const wrInst = new CalypsoWriteInstance(this.lts.bc, Instance.fromProof(wrID, wrProof));
        return CalypsoData.decrypt(wrInst.write, key);
    }

    async hasAccess(wrID: Buffer): Promise<boolean> {
        const caWr = await CalypsoWriteInstance.fromByzcoin(this.lts.bc, wrID);
        const auth = await this.lts.bc.checkAuthorization(this.lts.bc.genesisID, caWr.darcID,
            IdentityWrapper.fromIdentity(new IdentityDarc({id: this.signerID})));
        return auth.find(rule => rule === "spawn:" + CalypsoReadInstance.contractID) !== undefined;
    }
}


export class CalypsoData {
    static readonly algo = 'aes-192-gcm';

    static encrypt(lts: LTSIDX, darcID: InstanceID, data: Buffer, extradata?: Buffer,
                   key?: Buffer): Write {
        if (!key || key.length !== 24) {
            key = randomBytes(24);
        }
        const iv = randomBytes(16);
        const enc = createCipheriv(this.algo, key, iv);
        const write = Write.createWrite(lts.id, darcID, lts.X, key);
        write.data = Buffer.concat([enc.update(data), enc.final()]);
        const ivAuth = Buffer.concat([iv, enc.getAuthTag()]);
        if (extradata) {
            write.extradata = Buffer.concat([ivAuth, extradata]);
        } else {
            write.extradata = ivAuth;
        }
        return write;
    }

    static decrypt(wr: Write, key: Buffer): Buffer {
        const dec = createDecipheriv(this.algo, key, wr.extradata.slice(0, 16));
        dec.setAuthTag(wr.extradata.slice(16));
        return Buffer.concat([dec.update(wr.data), dec.final()]);
    }
}

export interface LTSIDX {
    id: Buffer;
    X: Point;
}
