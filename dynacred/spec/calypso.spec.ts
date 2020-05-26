import { CalypsoReadInstance, CalypsoWriteInstance, LongTermSecret, OnChainSecretRPC } from "@dedis/cothority/calypso";
import { Darc } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";
import { randomBytes } from "crypto";
import { KeyPair } from "dynacred";
import { BCTestEnv, simul } from "spec/simul/itest";
import { ROSTER } from "spec/support/conodes";
import { Calypso, CalypsoData } from "src/calypso";
import { SpawnerTransactionBuilder } from "src/spawnerTransactionBuilder";

describe("Calypso should", () => {
    it("be able to create write and read requests", async () => {
        if (simul) {
            Log.warn("cannot test calypso with simulation");
            return;
        }
        const bct = await BCTestEnv.start();

        const ocs = new OnChainSecretRPC(bct.bc);
        await ocs.authorizeRoster();
        const lts = await LongTermSecret.spawn(bct.bc, bct.darcID, bct.signers, ROSTER);
        const calypso = new Calypso(lts, bct.user.identityDarcSigner.id, bct.user.credStructBS.credCalypso);

        const calypsoDarc = Darc.createBasic([bct.user.kiSigner], [bct.user.kiSigner],
            Buffer.from("calypsoDarc"));
        calypsoDarc.rules.setRule("spawn:" + CalypsoReadInstance.contractID, bct.user.kiSigner);
        calypsoDarc.rules.setRule("delete:" + CalypsoWriteInstance.contractID, bct.user.kiSigner);
        await bct.user.executeTransactions((t) => {
            t.spawnDarc(calypsoDarc);
        }, 10);

        const fileName = "test.txt";
        expect(bct.user.credStructBS.credCalypso.getValue().map.size).toBe(0);
        const content = Buffer.from("very important secret");
        const tx = bct.user.startTransaction();
        const wrID = calypso.addFile(tx, calypsoDarc.getBaseID(), fileName, content);
        await tx.sendCoins(SpawnerTransactionBuilder.longWait);
        const im = bct.user.credStructBS.credCalypso.getValue();
        expect(im.map.size).toBe(1);
        expect(im.toKVs()[0].key.equals(wrID)).toBeTruthy();
        expect(im.toKVs()[0].value).toBe(fileName);

        const kp = KeyPair.rand();
        const buf = await calypso.getFile(tx, wrID, kp);
        await tx.sendCoins(SpawnerTransactionBuilder.longWait);
        expect(content.equals(buf)).toBeTruthy();

        calypso.rmFile(tx, fileName);
        await tx.sendCoins(SpawnerTransactionBuilder.longWait);
        await expectAsync(calypso.getFile(tx, wrID, kp)).toBeRejected();
    });

    it("be able to encrypt and decrypt using GCM", async () => {
        const lts = {id: randomBytes(32), X: KeyPair.rand().pub};
        const darcID = randomBytes(32);
        const data = Buffer.from("very secret data");
        const extradata = Buffer.from("public data");
        const key = randomBytes(24);

        const secretData = CalypsoData.encrypt(lts, darcID, data, undefined, key);
        const decryptedData = CalypsoData.decrypt(secretData, key);
        expect(decryptedData.equals(data)).toBeTruthy();

        const secretData2 = CalypsoData.encrypt(lts, darcID, data, extradata, key);
        expect(secretData2.extradata.slice(32).equals(extradata)).toBeTruthy();
        const decryptedData2 = CalypsoData.decrypt(secretData, key);
        expect(decryptedData2.equals(data)).toBeTruthy();
    });
});
