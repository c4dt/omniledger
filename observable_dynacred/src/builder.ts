import URL from "url-parse";
import {catchError, flatMap, map, mergeAll} from "rxjs/operators";
import {BehaviorSubject} from "rxjs";

import {Log} from "@c4dt/cothority/index";
import {Instance, InstanceID} from "@c4dt/cothority/byzcoin";
import {Darc, IdentityWrapper} from "@c4dt/cothority/darc";
import {
    Coin,
    CoinInstance,
    CredentialsInstance,
    CredentialStruct,
    SpawnerInstance
} from "@c4dt/cothority/byzcoin/contracts";

import {ByzCoinBS} from "./genesis";
import {CredentialPublic, CredentialStructBS, EAttributesPublic, ECredentials} from "./credentialStructBS";
import {ABActionsBS, ABContactsBS, ABGroupsBS, ActionBS, AddressBook} from "./addressBook";
import {KeyPair} from "./keypair";
import {CredentialSignerBS, CSTypesBS} from "./credentialSignerBS";
import {ConvertBS, ObservableToBS} from "./observableHO";
import {newIInstance} from "./instances";
import {CoinBS} from "./coinBS";
import {IMigrate, User} from "./user";
import {DarcBS, DarcsBS} from "./darcsBS";

export class ByzCoinBuilder extends ByzCoinBS {
    constructor(bid: ByzCoinBS) {
        super(bid.bc, bid.db, bid.inst);
    }

    public async getAddressBook(cp: CredentialPublic): Promise<AddressBook> {
        Log.lvl3("getting contacts");
        const contactBS = new ABContactsBS(cp.contacts,
            await ObservableToBS(cp.contacts.pipe(
                flatMap(ais => Promise.all(ais.toInstanceIDs().map(
                    async (id) => this.getCredentialStructBS(id)
                )))))
        );

        Log.lvl3("getting groups");
        const groupsBS = new ABGroupsBS(cp.groups,
            await this.getDarcsBS(ConvertBS(cp.groups, gr => gr.toInstanceIDs())));

        Log.lvl3("getting actions");
        const actionsBS = new ABActionsBS(cp.actions,
            await ObservableToBS(cp.actions.pipe(
                flatMap(ais => Promise.all(ais.toInstanceIDs().map(
                    id => this.getDarcBS(id)
                ))),
                map(dbs => dbs.map(db => new ActionBS(db)))
            )));
        return new AddressBook(contactBS, groupsBS, actionsBS);
    }

    public async getUser(credID: InstanceID, privBuf: Buffer,
                         dbBase = "main"): Promise<User> {
        Log.lvl3("getting credential struct BS");
        const credStructBS = await this.getCredentialStructBS(credID);
        const kpp = KeyPair.fromPrivate(privBuf);
        const auth = await this.bc.checkAuthorization(this.bc.genesisID, credStructBS.darcID,
            IdentityWrapper.fromIdentity(kpp.signer()));
        Log.print("authentication is:", auth);
        Log.lvl3("getting credentialSignerBS");
        const credSignerBS = await this.getCredentialSignerBS(credStructBS);
        const spawnerInstanceBS = await ObservableToBS(credStructBS.credConfig.spawnerID.pipe(
            flatMap(id => this.inst.instanceBS(id)),
            catchError(err => {
                Log.error(err);
                return Promise.resolve(new BehaviorSubject(
                    newIInstance(Buffer.alloc(32), Buffer.alloc(0), SpawnerInstance.contractID)));
            }),
            mergeAll(),
            map(inst => Buffer.from(JSON.stringify({
                contractID: inst.contractID, darcID: inst.darcID,
                data: inst.value, id: inst.key
            }))),
            map(instBuf => new SpawnerInstance(this.bc, Instance.fromBytes(instBuf)))
        ));
        Log.lvl3("getting coinBS");
        const coinBS = await this.getCoinBS(credStructBS.credPublic.coinID);
        Log.lvl3("getting address book");
        const addressBook = await this.getAddressBook(credStructBS.credPublic);
        const user = new User(
            this, kpp, dbBase, credStructBS, spawnerInstanceBS, coinBS, credSignerBS, addressBook
        );
        await user.save();
        return user;
    }

    public async getUserFromEphemeral(ephemeral: KeyPair, dbBase = "main"): Promise<User> {
        const credID = CredentialsInstance.credentialIID(ephemeral.pub.marshalBinary());
        const u = await this.getUser(credID, ephemeral.priv.marshalBinary(), dbBase);
        await u.switchKey(ephemeral);
        return u;
    }

    public async getUserFromURL(urlStr: string, dbBase = "main"): Promise<User> {
        const url = new URL(urlStr, true);
        if (!url.pathname.includes(User.urlNewDevice)) {
            throw new Error("not a newDevice url");
        }
        if (!url.query.credentialIID ||
            !url.query.ephemeral) {
            throw new Error("need credentialIID and ephemeral");
        }
        const credID = Buffer.from(url.query.credentialIID, "hex");
        const ephemeralBuf = Buffer.from(url.query.ephemeral, "hex");
        if (credID.length !== 32 || ephemeralBuf.length !== 32) {
            throw new Error("either credentialIID or ephemeral is not of length 32 bytes");
        }

        const u = await this.getUser(credID, ephemeralBuf, dbBase);
        await u.switchKey(KeyPair.fromPrivate(ephemeralBuf));
        return u;
    }

    public async getUserFromMigration(): Promise<User | undefined> {
        try {
            const migrate: IMigrate | undefined = await this.db.getObject(User.keyMigrate);
            if (migrate && migrate.version === User.versionMigrate) {
                // Just suppose everything is here and let it fail otherwise.
                Log.lvl1("Migrating from", migrate);
                const credStruct = CredentialStruct.decode(migrate.contact.credential);
                const seed = credStruct.getAttribute(ECredentials.pub,
                    EAttributesPublic.seedPub);
                if (!seed) {
                    Log.error("couldn't get seed");
                    return undefined;
                }
                const credID = CredentialsInstance.credentialIID(seed);
                if (User.migrateOnce) {
                    await this.db.set(User.keyMigrate, Buffer.alloc(0));
                }
                return this.getUser(credID, Buffer.from(migrate.keyIdentity, "hex"));
            }
        } catch (e) {
            Log.lvl4("Nothing to migrate from", e)
        }
        return undefined;
    }

    public async getUserFromDB(base = "main"): Promise<User> {
        const user = await this.getUserFromMigration();
        if (user) {
            return user;
        }

        const [privBuf, credID] = await this.getUserKeyCredID(base);
        return this.getUser(credID, privBuf, base);
    }

    public async getUserKeyCredID(base = "main"): Promise<[Buffer, Buffer]> {
        const key = await this.db.get(`${base}:${User.keyPriv}`);
        const credID = await this.db.get(`${base}:${User.keyCredID}`);
        if (key && credID && key.length === 32 && credID.length === 32) {
            return [key, credID];
        }
        throw new Error("couldn't find correct key and/or credID at: " + base);
    }

    public async getCoinBS(coinID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<CoinBS> {
        if (coinID instanceof Buffer) {
            coinID = new BehaviorSubject(coinID);
        }
        const coinObs = coinID.pipe(
            flatMap(id => this.inst.instanceBS(id)),
            mergeAll(),
            map(inst => CoinInstance.create(this.bc as any, inst.key, inst.darcID, Coin.decode(inst.value)))
        );
        return new CoinBS(this, await ObservableToBS(coinObs));
    }

    public async getCredentialSignerBS(credStructBS: CredentialStructBS): Promise<CredentialSignerBS> {
        Log.lvl3("searching signer darc");
        const signerDarcID = (await credStructBS.getSignerIdentityDarc()).id;
        Log.lvl3("searching signer darc");
        const darcBS = await this.getDarcBS(signerDarcID);
        Log.lvl3("loading devices");
        const aisbs = ConvertBS(credStructBS.credDevices, im => im.toInstanceIDs());
        Log.lvl3("going");
        const devices = new CSTypesBS(darcBS, credStructBS.credDevices, "device",
            await this.getDarcsBS(aisbs));
        Log.lvl3("loading recoveries");
        const recoveries = new CSTypesBS(darcBS, credStructBS.credRecoveries, "recovery",
            await this.getDarcsBS(
                ConvertBS(credStructBS.credRecoveries, im => im.toInstanceIDs())));
        return new CredentialSignerBS(darcBS, devices, recoveries);
    }

    public async getCredentialStructBS(id: InstanceID): Promise<CredentialStructBS> {
        Log.lvl3("creating CredentialStruct from scratch:", id);
        const instBS = await this.inst.instanceBS(id);
        const darcID = instBS.getValue().darcID;
        const credBS = ConvertBS(instBS, inst => CredentialStruct.decode(inst.value));
        return new CredentialStructBS(this, id, darcID, credBS);
    }

    public async getDarcsBS(aisbs: BehaviorSubject<InstanceID[]>): Promise<DarcsBS> {
        const dbs = await ObservableToBS(aisbs.pipe(
            flatMap(ais => Promise.all(ais
                .map(iid => this.getDarcBS(iid))))));
        return new DarcsBS(dbs);
    }

    public async getDarcBS(darcID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<DarcBS> {
        if (darcID instanceof Buffer) {
            darcID = new BehaviorSubject(darcID);
        }
        const instObs = darcID.pipe(
            // TODO: would it work to remove flatMap with mergeAll?
            flatMap(id => this.inst.instanceBS(id)),
            mergeAll(),
            map(inst => Darc.decode(inst.value)),
        );
        const bsDarc = await ObservableToBS(instObs);
        return new DarcBS(bsDarc)
    }
}
