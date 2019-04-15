// import Keccak from 'keccak/lib/keccak';
// import Shake from 'keccak/lib/shake';
import Keccak from 'keccak';
import {Log} from './Log';
import {curve} from '@dedis/kyber';
import {CalypsoReadInstance, CalypsoWriteInstance, Read, Write} from './cothority/calypso/calypso-instance';
import {TestData} from './Data';
import {Defaults} from './Defaults';
import OnChainSecretRPC from './cothority/calypso/calypso-rpc';
import {KeyPair} from './KeyPair';

const Curve25519 = curve.newCurve('edwards25519');

describe('keccak should be a sponge', () => {
    it('should return squeezed data', () => {
        /* Created from go with:
            k := keccak.New([]byte("keccak message"))
            for i := 0; i < 10; i++{
                    out := make([]byte, i)
                    k.Read(out)
                    fmt.Printf("'%x',\n", out)
            }
         */
        let res = [
            '',
            '9f',
            '66ac',
            '9d3b8d',
            '024d6440',
            '49369f76b2',
            '42161ce754b7',
            '56a9b322a98b6d',
            'a7d38c6ef3d29b29',
            '5eb668c1eb315106e4',
        ];
        const k = new Keccak('shake256');
        k.update(Buffer.from('keccak message'));
        for (let i = 0; i < 10; i++) {
            expect(k.squeeze(i)).toEqual(Buffer.from(res[i], 'hex'));
        }
    });
});

describe('Calypso.createWrite should', () => {
    it('return the same as in go', async () => {
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
        let ltsID = Buffer.from('4c545320496e7374616e63652049440000000000000000000000000000000000', 'hex');
        let writeDarc = Buffer.from('5772697465204461726320494400000000000000000000000000000000000000', 'hex');
        let X = Curve25519.point();
        X.unmarshalBinary(Buffer.from('14416767726567617465207075626c6963206b65796445b49ac5ec4c9161e706', 'hex'));
        let key = Buffer.from('56657279205365637265742053796d6d6574726963204b6579', 'hex');

        let k = new Keccak('shake256');
        k.update(ltsID);
        let wr = await Write.createWrite(ltsID, writeDarc, X, key, l => k.squeeze(l));

        let U = Curve25519.point();
        U.unmarshalBinary(Buffer.from('946de817c1bd2465559ba9c5c0def6feeb6a3b842e9b6ff86d34b638a41f11ed', 'hex'));
        let Ubar = Curve25519.point();
        Ubar.unmarshalBinary(Buffer.from('c47944aacc329efcff490e5b4cf79c4706c6a5eaa1341b0afa54bc9dcaf581f0', 'hex'));
        let E = Curve25519.scalar();
        E.unmarshalBinary(Buffer.from('c4c4d3aa5b2a6dea627c3c843a1d407d748b222af45472b7015de160618fcf09', 'hex'));
        let F = Curve25519.scalar();
        F.unmarshalBinary(Buffer.from('f940db2931d055e08c330cfffeeefa30ccf0638b2cb0d779725b5ccb2781510a', 'hex'));
        let C = Curve25519.point();
        C.unmarshalBinary(Buffer.from('767057c87242f52c06e5e7c44d67fa92a04f20dd8dd373b5f818923648290f4b', 'hex'));

        expect(wr.u.equals(U.marshalBinary())).toBeTruthy();
        expect(wr.ubar.equals(Ubar.marshalBinary())).toBeTruthy();
        expect(wr.e.equals(E.marshalBinary())).toBeTruthy();
        expect(wr.f.equals(F.marshalBinary())).toBeTruthy();
        expect(wr.c.equals(C.marshalBinary())).toBeTruthy();
        expect(wr.ltsid.equals(ltsID)).toBeTruthy();
    });
});

describe('In a full byzcoin setting, it should', () => {
    let tdAdmin: TestData;
    let ocs: OnChainSecretRPC;

    beforeAll(async () => {
        tdAdmin = await TestData.init(Defaults.Roster, 'admin');
        let roster = tdAdmin.bc.getConfig().roster;
        ocs = new OnChainSecretRPC(tdAdmin.bc);
        for (let i = 0; i < roster.list.length; i++) {
            Log.lvl2('Authorizing lts-creation by byzcoin on node', roster.list[i].address);
            await ocs.authorise(roster.list[i], tdAdmin.bc.genesisID);
        }
    });

    it('be able to create an LTS', async () => {
        Log.lvl1('Creating new LTS');
        let lts = await ocs.createLTS(tdAdmin.bc, tdAdmin.bc.getConfig().roster, tdAdmin.darc.getBaseID(),
            [tdAdmin.admin]);
        let key = Buffer.from('Very Secret Key');

        Log.lvl2('Creating Write instance');
        let wr = await Write.createWrite(lts.instanceid, tdAdmin.darc.getBaseID(), lts.X, key);
        let wrInst = await CalypsoWriteInstance.spawn(tdAdmin.bc, tdAdmin.darc.getBaseID(), wr, [tdAdmin.admin]);

        Log.lvl2('Creating Read instance');
        let kp = new KeyPair();
        let readInst = await CalypsoReadInstance.spawn(tdAdmin.bc, wrInst.id, kp._public.point, [tdAdmin.admin]);
        let decrypt = await ocs.reencryptKey(await tdAdmin.bc.getProof(wrInst.id), await tdAdmin.bc.getProof(readInst.id));
        let newKey = await decrypt.decrypt(kp._private.scalar);
        expect(newKey).toEqual(key);
    });

    it('create an LTS and a write using the spawner', async () => {
        Log.lvl1('Creating new LTS');
        let lts = await ocs.createLTS(tdAdmin.bc, tdAdmin.bc.getConfig().roster, tdAdmin.darc.getBaseID(),
            [tdAdmin.admin]);
        let key = Buffer.from('Very Secret Key');

        Log.lvl2('Creating Write instance');
        let wrInst = await tdAdmin.spawnerInstance.spawnCalypsoWrite(tdAdmin.coinInstance, [tdAdmin.keyIdentitySigner], lts, key,
            tdAdmin.contact.darcSignIdentity);

        Log.lvl2('Creating Read instance');
        let kp = new KeyPair();
        let readInst = await wrInst.spawnRead(kp._public.point, [tdAdmin.keyIdentitySigner],
            tdAdmin.coinInstance, [tdAdmin.keyIdentitySigner]);
        let newKey = await readInst.decrypt(ocs, kp._private.scalar);
        expect(newKey).toEqual(key);
    });
});
