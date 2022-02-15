import { Log } from "@dedis/cothority";
import { Instance, InstanceID } from "@dedis/cothority/byzcoin";
import { CalypsoReadInstance, CalypsoWriteInstance, LongTermSecret, Write } from "@dedis/cothority/calypso";
import { Darc, IdentityWrapper } from "@dedis/cothority/darc";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";
import { Point } from "@dedis/kyber";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto-browserify";
import { CredentialInstanceMapBS } from "./credentialStructBS";
import { KeyPair } from "./keypair";
import { SpawnerTransactionBuilder } from "./spawnerTransactionBuilder";

export class Calypso {

    static spawnDarc(tx: SpawnerTransactionBuilder, desc: string, evolve: InstanceID,
                     read = evolve, del = read, update = read): Darc {
        const d = Darc.createBasic([new IdentityDarc({id: evolve})], [], Buffer.from(desc));
        d.rules.setRule(`spawn:${CalypsoReadInstance.contractID}`, new IdentityDarc({id: read}));
        d.rules.setRule(`delete:${CalypsoWriteInstance.contractID}`, new IdentityDarc({id: del}));
        d.rules.setRule(`invoke:${CalypsoWriteInstance.contractID}.${CalypsoWriteInstance.commandUpdate}`,
            new IdentityDarc({id: update}));
        return tx.spawnDarc(d);
    }

    constructor(
        public lts: LongTermSecret,
        private signerID: InstanceID,
        public cim: CredentialInstanceMapBS) {
    }

    addFile(tx: SpawnerTransactionBuilder, darcID: InstanceID, name: string, data: Buffer): InstanceID {
        if (this.cim.hasEntry(Buffer.from(name))) {
            throw new Error("cannot add file with existing name");
        }

        const wr = CalypsoData.encrypt(this.lts, darcID, data);
        const wrID = tx.spawnCalypsoWrite(darcID, wr);
        this.cim.setEntry(tx, name, wrID);
        return wrID;
    }

    rmFile(tx: SpawnerTransactionBuilder, name: string) {
        const wrID = this.cim.getValue().toKVs()
            .find((kv) => kv.value === name);
        if (!wrID) {
            throw new Error("this write-ID doesn't exist");
        }
        tx.delete(wrID.key, CalypsoWriteInstance.contractID);
        this.cim.rmEntry(tx, wrID.key);
    }

    async getFileRead(tx: SpawnerTransactionBuilder, wrID: Buffer, kp = KeyPair.rand()): Promise<InstanceID> {
        tx.progress(30, "Spawning read transaction");
        const rdID = tx.spawnCalypsoRead(wrID, kp.pub);
        await tx.sendCoins(SpawnerTransactionBuilder.longWait);
        return rdID;
    }

    async getFileContent(tx: SpawnerTransactionBuilder, wrID: Buffer, rdID: Buffer, kp: KeyPair): Promise<Buffer> {
        tx.progress(-40, "Getting write proof");
        const wrProof = await this.lts.bc.getProof(wrID, undefined, undefined, false);
        tx.progress(-50, "Getting read proof");
        const rdProof = await this.lts.bc.getProof(rdID, undefined, undefined, false);
        tx.progress(-60, "Asking for re-encryption");
        const xhatenc = await this.lts.reencryptKey(
            wrProof,
            rdProof,
        );

        const key = await xhatenc.decrypt(kp.priv);
        tx.progress(-80, "Getting write instance");
        const wrInst = new CalypsoWriteInstance(this.lts.bc, Instance.fromProof(wrID, wrProof));
        tx.progress(-90, "Decrypting");
        return CalypsoData.decrypt(wrInst.write, key);
    }

    async getFile(tx: SpawnerTransactionBuilder, wrID: Buffer, kp = KeyPair.rand()): Promise<Buffer> {
        const rdID = await this.getFileRead(tx, wrID, kp);
        return this.getFileContent(tx, wrID, rdID, kp);
    }

    async hasAccess(wrID: Buffer): Promise<boolean> {
        const caWr = await CalypsoWriteInstance.fromByzcoin(this.lts.bc, wrID);
        const auth = await this.lts.bc.checkAuthorization(this.lts.bc.genesisID, caWr.darcID,
            IdentityWrapper.fromIdentity(new IdentityDarc({id: this.signerID})));
        return auth.find((rule) => rule === "spawn:" + CalypsoReadInstance.contractID) !== undefined;
    }
}

export class CalypsoData {
    static readonly algo = "aes-192-gcm";

    static encrypt(lts: ILTSIDX, darcID: InstanceID, data: Buffer, extradata?: Buffer,
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

export interface ILTSIDX {
    id: Buffer;
    X: Point;
}
