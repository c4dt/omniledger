import DarcInstance from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import { CalypsoReadInstance, CalypsoWriteInstance, Write } from "@c4dt/cothority/calypso/calypso-instance";
import { OnChainSecretRPC } from "@c4dt/cothority/calypso/calypso-rpc";
import Darc from "@c4dt/cothority/darc/darc";
import Rules from "@c4dt/cothority/darc/rules";
import { Log } from "@c4dt/cothority/log";
import { curve } from "@dedis/kyber";
import Keccak from "keccak";
import { TestData } from "src/lib/Data";
import { KeyPair } from "src/lib/KeyPair";

const curve25519 = curve.newCurve("edwards25519");

describe("keccak should be a sponge", () => {
    it("should return squeezed data", () => {
        /* Created from go with:
            k := keccak.New([]byte("keccak message"))
            for i := 0; i < 10; i++{
                    out := make([]byte, i)
                    k.Read(out)
                    fmt.Printf("'%x',\n", out)
            }
         */
        const res = [
            "",
            "9f",
            "66ac",
            "9d3b8d",
            "024d6440",
            "49369f76b2",
            "42161ce754b7",
            "56a9b322a98b6d",
            "a7d38c6ef3d29b29",
            "5eb668c1eb315106e4",
        ];
        const k = new Keccak("shake256");
        k.update(Buffer.from("keccak message"));
        for (let i = 0; i < 10; i++) {
            expect(k.squeeze(i)).toEqual(Buffer.from(res[i], "hex"));
        }
    });
});

describe("Calypso.createWrite should", () => {
    it("return the same as in go", async () => {
        /* Go-file:
        ltsid := byzcoin.NewInstanceID([]byte("LTS Instance ID"))
        writeDarc := darc.ID(byzcoin.NewInstanceID([]byte("Write Darc ID")).Slice())
        X := cothority.Suite.Point().Embed([]byte("Aggregate public key"), keccak.New([]byte("public")))
        key := []byte("Very Secret Symmetric Key")
        w := calypso.NewWrite(cothority.Suite, ltsid, writeDarc, X, key, keccak.New(ltsid.Slice()))
        log.Printf("ltsID: %x", ltsid[:])
        log.Printf("writeDarc: %x", writeDarc)
        Xbuf, _ := X.MarshalBinary()
        log.Printf("X: %x", Xbuf)
        log.Printf("key: %x", key)
        log.Printf("w: %+v", w)
         */
        const ltsID = Buffer.from("4c545320496e7374616e63652049440000000000000000000000000000000000", "hex");
        const writeDarc = Buffer.from("5772697465204461726320494400000000000000000000000000000000000000", "hex");
        const X = curve25519.point();
        X.unmarshalBinary(Buffer.from("14416767726567617465207075626c6963206b65796445b49ac5ec4c9161e706", "hex"));
        const key = Buffer.from("56657279205365637265742053796d6d6574726963204b6579", "hex");

        const k = new Keccak("shake256");
        k.update(ltsID);
        const wr = await Write.createWrite(ltsID, writeDarc, X, key, (l) => k.squeeze(l));

        const U = curve25519.point();
        U.unmarshalBinary(Buffer.from("946de817c1bd2465559ba9c5c0def6feeb6a3b842e9b6ff86d34b638a41f11ed", "hex"));
        // tslint:disable-next-line
        const Ubar = curve25519.point();
        Ubar.unmarshalBinary(Buffer.from("c47944aacc329efcff490e5b4cf79c4706c6a5eaa1341b0afa54bc9dcaf581f0", "hex"));
        const E = curve25519.scalar();
        E.unmarshalBinary(Buffer.from("c4c4d3aa5b2a6dea627c3c843a1d407d748b222af45472b7015de160618fcf09", "hex"));
        const F = curve25519.scalar();
        F.unmarshalBinary(Buffer.from("f940db2931d055e08c330cfffeeefa30ccf0638b2cb0d779725b5ccb2781510a", "hex"));
        const C = curve25519.point();
        C.unmarshalBinary(Buffer.from("767057c87242f52c06e5e7c44d67fa92a04f20dd8dd373b5f818923648290f4b", "hex"));

        expect(wr.u.equals(U.marshalBinary())).toBeTruthy();
        expect(wr.ubar.equals(Ubar.marshalBinary())).toBeTruthy();
        expect(wr.e.equals(E.marshalBinary())).toBeTruthy();
        expect(wr.f.equals(F.marshalBinary())).toBeTruthy();
        expect(wr.c.equals(C.marshalBinary())).toBeTruthy();
        expect(wr.ltsid.equals(ltsID)).toBeTruthy();
    });
});

describe("In a full byzcoin setting, it should", () => {
    let tdAdmin: TestData;
    let ocs: OnChainSecretRPC;

    beforeAll(async () => {
        tdAdmin = await TestData.init();
        ocs = new OnChainSecretRPC(tdAdmin.bc);
    });

    it("be able to create an LTS", async () => {
        Log.lvl1("Creating new LTS");
        const lts = await ocs.createLTS(tdAdmin.bc.getConfig().roster, tdAdmin.darc.getBaseID(),
            [tdAdmin.admin]);
        const key = Buffer.from("Very Secret Key");

        Log.lvl2("Creating Write instance");
        const wr = await Write.createWrite(lts.instanceid, tdAdmin.darc.getBaseID(), lts.X, key);
        const wrInst = await CalypsoWriteInstance.spawn(tdAdmin.bc, tdAdmin.darc.getBaseID(), wr, [tdAdmin.admin]);

        Log.lvl2("Creating Read instance");
        const kp = new KeyPair();
        const readInst = await CalypsoReadInstance.spawn(tdAdmin.bc, wrInst.id, kp._public.point, [tdAdmin.admin]);
        const decrypt = await ocs.reencryptKey(await tdAdmin.bc.getProof(wrInst.id),
            await tdAdmin.bc.getProof(readInst.id));
        const newKey = await decrypt.decrypt(kp._private.scalar);
        expect(newKey).toEqual(key);
    });

    it("create an LTS and a write using the spawner", async () => {
        Log.lvl1("Creating new LTS");
        const key = Buffer.from("Very Secret Key");

        Log.lvl2("Creating Write instance");
        const wrInst = await tdAdmin.spawnerInstance.spawnCalypsoWrite(tdAdmin.coinInstance,
            [tdAdmin.keyIdentitySigner], tdAdmin.lts, key,
            [await tdAdmin.contact.getDarcSignIdentity()]);

        Log.lvl2("Creating Read instance");
        const kp = new KeyPair();
        const readInst = await wrInst.spawnRead(kp._public.point, [tdAdmin.keyIdentitySigner],
            tdAdmin.coinInstance, [tdAdmin.keyIdentitySigner]);
        const newKey = await readInst.decrypt(ocs, kp._private.scalar);
        expect(newKey).toEqual(key);
    });

    it("verify and change access rights", async () => {
        const key = Buffer.from("Very Secret Key");

        Log.lvl2("Creating Write instance");
        const wrInst = await tdAdmin.spawnerInstance.spawnCalypsoWrite(tdAdmin.coinInstance,
            [tdAdmin.keyIdentitySigner], tdAdmin.lts, key,
            [await tdAdmin.contact.getDarcSignIdentity()]);
        const wrDarc = await DarcInstance.fromByzcoin(tdAdmin.bc, wrInst.darcID);
        expect(wrDarc.darc.rules.getRule(Darc.ruleSign).expr.toString().includes(" ")).toBeFalsy();
        const nd = wrDarc.darc.evolve();
        nd.rules.appendToRule(Darc.ruleSign, tdAdmin.keyIdentitySigner, Rules.OR);
        await wrDarc.evolveDarcAndWait(nd, [tdAdmin.keyIdentitySigner], 5);
    });
});
