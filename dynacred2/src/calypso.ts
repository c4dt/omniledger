import {CredentialInstanceMapBS} from "./credentialStructBS";
import {CredentialTransaction} from "./credentialTransaction";
import {Instance, InstanceID} from "@dedis/cothority/byzcoin";
import {CalypsoWriteInstance, LongTermSecret, Write} from "@dedis/cothority/calypso";
import IdentityDarc from "@dedis/cothority/darc/identity-darc";
import {IdentityWrapper} from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";
import {KeyPair} from "./keypair";
import {createCipheriv, randomBytes} from "crypto-browserify";
import {createDecipheriv} from "crypto";
import {Point} from "@dedis/kyber/index";

export class Calypso {
    constructor(
        private lts: LongTermSecret,
        private ctx: CredentialTransaction,
        private signerID: InstanceID,
        public cim: CredentialInstanceMapBS) {
    }

    async addFile(darcID: InstanceID, name: string, data: Buffer): Promise<Buffer> {
        if (this.cim.hasEntry(Buffer.from(name))) {
            throw new Error("cannot add file with existing name");
        }

        let tx = this.ctx.clone();
        const wr = CalypsoData.encrypt(this.lts, darcID, data);
        tx.spawnCalypsoWrite(darcID, wr);
        const [ctx, _] = await tx.sendCoins(10);
        const wrID = ctx.instructions[1].deriveId("");

        tx = this.ctx.clone();
        this.cim.setEntry(tx, name, wrID);
        await tx.sendCoins(10);

        return wrID;
    }

    async rmFile(name: string) {
        this.cim.getValue().toKVs().forEach(kv => Log.print(kv));
        const wrID = this.cim.getValue().toKVs()
            .find(kv => kv.value === name);
        if (!wrID) {
            throw new Error("this write-ID doesn't exist");
        }
        Log.print("deleting");
        const tx = this.ctx.clone();
        tx.delete(wrID.key, CalypsoWriteInstance.contractID);
        this.cim.rmEntry(tx, wrID.key);
        return tx.sendCoins(10);
    }

    async getFile(wrID: Buffer, kp: KeyPair): Promise<Buffer> {
        let tx = this.ctx.clone();
        tx.spawnCalypsoRead(wrID, kp.pub);
        const [ctx, _] = await tx.sendCoins(10);
        const rdID = ctx.instructions[1].deriveId("");

        const wrProof = await this.ctx.bc.getProof(wrID);
        const xhatenc = await this.lts.reencryptKey(
            wrProof,
            await this.ctx.bc.getProof(rdID),
        );
        const key = await xhatenc.decrypt(kp.priv);
        const wrInst = new CalypsoWriteInstance(this.lts.bc, Instance.fromProof(wrID, wrProof));
        return CalypsoData.decrypt(wrInst.write, key);
    }

    async hasAccess(wrID: Buffer): Promise<boolean> {
        const caWr = await CalypsoWriteInstance.fromByzcoin(this.ctx.bc, wrID);
        const auth = await this.ctx.bc.checkAuthorization(this.ctx.bc.genesisID, caWr.darcID,
            IdentityWrapper.fromIdentity(new IdentityDarc({id: this.signerID})));
        Log.print(auth);
        return auth.find(rule => rule === "crWr") !== undefined;
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
