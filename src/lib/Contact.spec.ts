import { TestBed, async } from '@angular/core/testing';
import {Log} from './Log';
import {Data, TestData} from './Data';
import {Contact} from './Contact';
import {Public} from './KeyPair';
import CredentialInstance, {
  Attribute,
  Credential,
  CredentialStruct
} from './cothority/byzcoin/contracts/credentials-instance';
import ClientTransaction from './cothority/byzcoin/client-transaction';
import ByzCoinRPC from './cothority/byzcoin/byzcoin-rpc';
import Proof, {StateChangeBody} from './cothority/byzcoin/proof';
import Darc from './cothority/darc/darc';
import SpawnerInstance from './cothority/byzcoin/contracts/spawner-instance';
import {Meetup, PersonhoodRPC, UserLocation} from './PersonhoodRPC';
import * as Long from 'long';
import {Defaults} from './Defaults';
import CoinInstance, {Coin} from './cothority/byzcoin/contracts/coin-instance';
import {InstanceID} from './cothority/byzcoin';
import {IIdentity} from './cothority/darc';
import Instance from './cothority/byzcoin/instance';
import CredentialsInstance from './cothority/byzcoin/contracts/credentials-instance';

fdescribe('Contact tests', () => {
  describe('no byzcoin needed to test', () => {
    // Always-matching proof
    class proofNull extends Proof {
      public stateChangeBody2: StateChangeBody;

      constructor(public id: InstanceID) {
        super({});
      }

      exists(): boolean {
        return true;
      }

      get contractID(): string {
        return this.stateChangeBody2.contractID;
      }

      get darcID(): InstanceID {
        return this.stateChangeBody2.darcID;
      }

      get value(): Buffer {
        return this.stateChangeBody2.value;
      }
    }

    class bcNull extends ByzCoinRPC {
      credInst: CredentialInstance;
      coinInst: CoinInstance;

      constructor(public credDarc: Darc) {
        super();
      };

      async getProof(iid: InstanceID): Promise<Proof> {
        let p = new proofNull(iid);
        Log.print('getting proof for ', iid);
        if (iid.equals(Buffer.alloc(32))) {
          p.stateChangeBody2 = <StateChangeBody> {
            value: this.credInst.credential.toBytes(),
            contractID: 'credential',
            darcID: this.credDarc.getBaseID()
          };
        } else if (this.coinInst && iid.equals(this.coinInst.id)) {
          p.stateChangeBody2 = <StateChangeBody> {
            value: this.coinInst.coin.toBytes(),
            contractID: 'coin',
            darcID: this.credDarc.getBaseID()
          };
        } else {
          p.stateChangeBody2 = <StateChangeBody> {value: this.credDarc.toBytes(), contractID: 'darc'};
        }
        return p;
      }

      async sendTransactionAndWait(transaction: ClientTransaction, wait: number = 5): Promise<any> {
        Log.print(transaction);
      }

      async getSignerCounters(signers: IIdentity[], increment: number): Promise<Long[]> {
        return [Long.fromNumber(increment)];
      }
    }

    xit('Simple qr-code parsing should work', async () => {
      Log.lvl1('*** simple qr-code parsing');
      let pubIdentity = Public.fromRand();
      let reg1 = new Contact(null, pubIdentity);
      let bc = new bcNull(Darc.newDarc([], [], Buffer.from('reg1')));
      reg1.credentialInstance = new CredentialsInstance(bc, Instance.fromFields(Buffer.alloc(32),
        CredentialsInstance.contractID, bc.credDarc.getBaseID(), Contact.prepareInitialCred("reg1", pubIdentity).toBytes()));
      reg1.alias = 'reg1';
      reg1.email = 'test@test.com';
      reg1.phone = '+41 1 111 11 11';
      let coinIID = Buffer.alloc(32);
      coinIID[0] = 1;
      reg1.credential.setAttribute('1-public', 'coin', coinIID);
      reg1.credentialInstance.credential = reg1.credential.copy();
      bc.credInst = reg1.credentialInstance;
      bc.coinInst = CoinInstance.create(bc, coinIID, null,
        new Coin({name: coinIID, value: Long.fromNumber(1)}));
      Log.print(1);
      let str = reg1.qrcodeIdentityStr();
      Log.print(4);
      let qrReg1 = await Contact.fromQR(bc, str);
      Log.print(3, qrReg1.unregisteredPub);
      expect(str).toEqual(qrReg1.qrcodeIdentityStr());
      expect(reg1.getCoinAddress().equals(coinIID)).toBeTruthy();

      let unreg2 = new Contact(null, Public.fromRand());
      unreg2.alias = 'reg1';
      unreg2.email = 'test@test.com';
      unreg2.phone = '+41 1 111 11 11';
      str = unreg2.qrcodeIdentityStr();
      Log.print(2);
      expect(str.startsWith(Contact.urlUnregistered)).toBeTruthy();
      let qrUnreg2 = await Contact.fromQR(bc, str);
      expect(str).toEqual(qrUnreg2.qrcodeIdentityStr());
    });
  });

  fdescribe('Contact should marshal and unmarshal', async () => {
    let tdAdmin: TestData;
    let reg1: Contact;
    let unreg2: Contact;

    beforeAll(async () => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 250000;
      try {
        Log.lvl1('Creating Byzcoin');
        tdAdmin = await TestData.init(new Data());
        for (let i = 0; i < 100; i++){
          Log.print("reading", i);
          await tdAdmin.cbc.bc.updateConfig();
        }
        Log.print("createAll")
        await tdAdmin.createAll('admin');
        Log.print("creating contact");
        reg1 = new Contact(null, Public.fromRand());
        reg1.alias = 'reg1';
        await tdAdmin.d.registerContact(reg1);
        unreg2 = new Contact(null, Public.fromRand());
        unreg2.alias = 'unreg2';
      } catch (e){
        Log.catch(e);
        throw new Error(e);
      }
    });

    it('should marshal / unmarshal contact', async () => {
      Log.lvl1('*** marshal / unmarshal contact');
      Log.print('before wait:', new Date().getTime());
      var start = new Date().getTime();
      while ((new Date().getTime() - start) < 1000000) {
      }
      Log.print('after wait:', new Date().getTime());
      Log.lvl1('testing registered user');
      let str = JSON.stringify(reg1.toObject());
      Log.lvl2('string is:', str);
      let umReg1 = await Contact.fromObjectBC(tdAdmin.cbc.bc, JSON.parse(str));
      expect(str).toEqual(JSON.stringify(umReg1.toObject()));

      Log.lvl1('testing unregistered user');
      str = JSON.stringify(unreg2.toObject());
      let umUnreg2 = await Contact.fromObjectBC(tdAdmin.cbc.bc, JSON.parse(str));
      expect(str).toEqual(JSON.stringify(umUnreg2.toObject()));

      Log.lvl1('testing qrcode on registered');
      str = reg1.qrcodeIdentityStr();
      umReg1 = await Contact.fromQR(tdAdmin.d.bc, str);
      expect(str).toEqual(umReg1.qrcodeIdentityStr());

      Log.lvl1('testing qrcode on unregistered');
      str = unreg2.qrcodeIdentityStr();
      umUnreg2 = await Contact.fromQR(tdAdmin.d.bc, str);
      expect(str).toEqual(umUnreg2.qrcodeIdentityStr());

      Log.lvl1('testing unregistered, but then registered user');
      let unreg3 = new Contact(null, Public.fromRand());
      unreg3.alias = 'unreg3';
      str = unreg3.qrcodeIdentityStr();
      let umUnreg3 = await Contact.fromQR(tdAdmin.d.bc, str);
      expect(str).toEqual(umUnreg3.qrcodeIdentityStr());
      expect(umUnreg3.isRegistered()).toBeFalsy();

      Log.lvl1('registering unreg3');
      await tdAdmin.d.registerContact(unreg3);
      str = unreg3.qrcodeIdentityStr();
      umUnreg3 = await Contact.fromQR(tdAdmin.d.bc, str);
      expect(str).toEqual(umUnreg3.qrcodeIdentityStr());
      expect(umUnreg3.isRegistered()).toBeTruthy();
    });
  });


  describe('With Byzcoin', async () => {
    let tdAdmin: TestData;
    let admin: Data;
    let phrpc: PersonhoodRPC;

    beforeAll(async () => {
      // await FileIO.rmrf(Defaults.DataDir);

      Log.lvl1('Trying to load previous byzcoin');
      admin = new Data({alias: 'admin'});
      admin.setFileName('data1.json');

      try {
        await admin.load();
      } catch (e) {
        Log.lvl1('Error while trying to load - going to reset chain');
        admin.contact.email = '';
      }
      if (admin.contact.email != '') {
        Log.lvl1('Probably found an existing byzcoin - using this one to speed up tests');
        admin.contacts = [];
        phrpc = new PersonhoodRPC(admin.bc);
        return;
      } else {
        admin = new Data({alias: 'admin'});
        admin.setFileName('data1.json');
      }

      Log.lvl1('Creating Byzcoin');
      tdAdmin = await TestData.init(new Data());
      await tdAdmin.createAll('admin');
      admin.contact.email = 'test@test.com';
      await admin.connectByzcoin();
      await tdAdmin.d.registerContact(admin.contact, Long.fromNumber(1e6));
      await admin.verifyRegistration();
      await admin.save();
      phrpc = new PersonhoodRPC(admin.bc);
    });

    afterEach(() => {
      Log.print('this line will be overwritten');
    });

    it('set recovery', async () => {
      let one = new Data({alias: 'one'});
      one.setFileName('contactOne.json');
      await one.connectByzcoin();

      await phrpc.wipeMeetups();

      await phrpc.meetups(new Meetup(UserLocation.fromContact(admin.contact)));
      await phrpc.meetups(new Meetup(UserLocation.fromContact(one.contact)));
      let users = await phrpc.meetups();

      Log.lvl1('Updating admin');
      let adminCopy = await users[0].toContact(admin.bc);
      await adminCopy.update(admin.bc);

      Log.lvl1('Updating one');
      let oneCopy = await users[1].toContact(admin.bc);
      await oneCopy.update(admin.bc);

      Log.lvl1('success');
    });

    it('registration keeps alias', async () => {
      let one = new Data({alias: 'one'});
      one.setFileName('contactOne.json');
      await one.connectByzcoin();
      await admin.registerContact(one.contact, Long.fromNumber(100000));
      await one.verifyRegistration();
      expect(one.contact.alias).toEqual('one');

      let two = new Data({alias: 'two'});
      two.setFileName('contacttwo.json');
      await two.connectByzcoin();

      one.addContact(two.contact);
      await one.registerContact(two.contact);
      await one.contacts[0].update(one.bc);
      expect(one.contacts[0].alias).toEqual('two');
    });
  });
});
