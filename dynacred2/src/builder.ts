import URL from "url-parse";
import {catchError, flatMap, map, mergeAll} from "rxjs/operators";
import {BehaviorSubject, of} from "rxjs";

import {Log} from "@dedis/cothority/index";
import {ByzCoinRPC, Instance, InstanceID, IStorage, Proof} from "@dedis/cothority/byzcoin";
import {Darc, IdentityDarc, IdentityWrapper} from "@dedis/cothority/darc";
import {
    Coin,
    CoinInstance,
    CredentialsInstance,
    CredentialStruct,
    SpawnerInstance
} from "@dedis/cothority/byzcoin/contracts";

import {
    CredentialInstanceMapBS,
    CredentialPublic,
    CredentialStructBS,
    EAttributesPublic,
    ECredentials
} from "./credentialStructBS";
import {ABActionsBS, ABContactsBS, ABGroupsBS, ActionBS, AddressBook} from "./addressBook";
import {KeyPair} from "./keypair";
import {CredentialSignerBS, CSTypesBS} from "./credentialSignerBS";
import {ConvertBS, ObservableToBS} from "./observableUtils";
import {User} from "./user";
import {DarcBS, DarcsBS} from "./byzcoin/darcsBS";
import {CoinBS} from "./byzcoin/coinBS";
import {bufferToObject} from "./utils";

export interface IMigrate {
    keyPersonhood?: string;
    keyIdentity: string;
    version: number;
    contact: { credential: Buffer };
}

export class ByzCoinBuilder {

    constructor(public bc: ByzCoinRPC,
                public db: IStorage) {
    }

    public async retrieveAddressBook(cp: CredentialPublic): Promise<AddressBook> {
        Log.lvl3("getting contacts");
        const contactBS = new ABContactsBS(cp.contacts,
            await ObservableToBS(cp.contacts.pipe(
                flatMap(ais => Promise.all(ais.toInstanceIDs().map(
                    (id) => this.retrieveCredentialStructBS(id)
                ))),
                map(css => css.filter(cs => cs !== undefined)),
                )
            )
        );

        Log.lvl3("getting groups");
        const groupsBS = new ABGroupsBS(cp.groups,
            await this.retrieveDarcsBS(ConvertBS(cp.groups, gr => gr.toInstanceIDs())));

        Log.lvl3("getting actions");
        const actionsBS = new ABActionsBS(cp.actions,
            await ObservableToBS(cp.actions.pipe(
                flatMap(ais => Promise.all(ais.toInstanceIDs().map(
                    id => this.retrieveDarcBS(id)
                ))),
                map(dbs => dbs.filter(db => db !== undefined)),
                map(dbs => dbs.map(db => new ActionBS(db)))
            )));
        return new AddressBook(contactBS, groupsBS, actionsBS);
    }

    public async retrieveUser(credID: InstanceID, privBuf: Buffer,
                              dbBase = "main"): Promise<User> {
        Log.lvl3("getting credential struct BS", credID);
        const credStructBS = await this.retrieveCredentialStructBS(credID);
        const kpp = KeyPair.fromPrivate(privBuf);
        const auth = await this.bc.checkAuthorization(this.bc.genesisID, credStructBS.darcID,
            IdentityWrapper.fromIdentity(kpp.signer()));
        Log.lvl1("auth is:", auth);
        Log.lvl3("getting credentialSignerBS");
        const credSignerBS = await this.retrieveCredentialSignerBS(credStructBS);
        const spawnerInstanceBS = await ObservableToBS(credStructBS.credConfig.spawnerID.pipe(
            flatMap(id => this.bc.instanceObservable(id)),
            catchError(err => {
                Log.error(err);
                return Promise.resolve(new BehaviorSubject(
                    new Proof({})));
            }),
            mergeAll(),
            map(inst => Buffer.from(JSON.stringify({
                contractID: inst.contractID, darcID: inst.darcID,
                data: inst.value, id: inst.key
            }))),
            map(instBuf => new SpawnerInstance(this.bc, Instance.fromBytes(instBuf)))
        ));
        Log.lvl3("getting coinBS");
        const coinBS = await this.retrieveCoinBS(credStructBS.credPublic.coinID);
        Log.lvl3("getting address book");
        const addressBook = await this.retrieveAddressBook(credStructBS.credPublic);
        const user = new User(
            this.bc, this.db, kpp, dbBase, credStructBS, spawnerInstanceBS, coinBS, credSignerBS, addressBook
        );
        await user.save();
        return user;
    }

    public async retrieveUserByEphemeral(ephemeral: KeyPair, dbBase = "main"): Promise<User> {
        Log.lvl3("getting credID");
        const credID = CredentialsInstance.credentialIID(ephemeral.pub.marshalBinary());
        const u = await this.retrieveUser(credID, ephemeral.priv.marshalBinary(), dbBase);
        await u.switchKey(ephemeral);
        return u;
    }

    public async retrieveUserByURL(urlStr: string, dbBase = "main"): Promise<User> {
        Log.lvl3("getting user from url", urlStr);
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

        const u = await this.retrieveUser(credID, ephemeralBuf, dbBase);
        await u.switchKey(KeyPair.fromPrivate(ephemeralBuf));
        return u;
    }

    public async migrateUser(dbold: IStorage, base = "main"): Promise<boolean> {
        try {
            Log.lvl3("trying to migrate");
            const userData = await dbold.get(User.keyMigrate);
            if (!userData) {
                return false;
            }
            const migrate = bufferToObject(userData) as IMigrate;
            if (migrate && migrate.version === User.versionMigrate) {
                // Just suppose everything is here and let it fail otherwise.
                Log.lvl1("Migrating from", migrate);
                const credStruct = CredentialStruct.decode(migrate.contact.credential);
                const seed = credStruct.getAttribute(ECredentials.pub,
                    EAttributesPublic.seedPub);
                if (!seed) {
                    Log.error("couldn't get seed");
                    return false;
                }
                const credID = CredentialsInstance.credentialIID(seed);
                const privKey = Buffer.from(migrate.keyIdentity, "hex");
                await this.db.set(`${base}:${User.keyPriv}`, privKey);
                await this.db.set(`${base}:${User.keyCredID}`, credID);
                Log.lvl1("Successfully written private key and credID");
                return true;
            }
        } catch (e) {
            Log.lvl4("Nothing to migrate from", e)
        }
        return false;
    }

    public async retrieveUserByDB(base = "main"): Promise<User> {
        Log.lvl3("getting key and credID from DB");
        const [privBuf, credID] = await this.retrieveUserKeyCredID(base);
        return this.retrieveUser(credID, privBuf, base);
    }

    public async retrieveUserKeyCredID(base = "main"): Promise<[Buffer, Buffer]> {
        const key = await this.db.get(`${base}:${User.keyPriv}`);
        const credID = await this.db.get(`${base}:${User.keyCredID}`);
        if (key && credID && key.length === 32 && credID.length === 32) {
            return [key, credID];
        }
        throw new Error("couldn't find correct key and/or credID at: " + base);
    }

    public async retrieveCoinBS(coinID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<CoinBS> {
        Log.lvl3("getting coinBS");
        if (coinID instanceof Buffer) {
            coinID = new BehaviorSubject(coinID);
        }
        const coinObs = coinID.pipe(
            flatMap(id => this.bc.instanceObservable(id)),
            mergeAll(),
            map(inst => CoinInstance.create(this.bc as any, inst.key, inst.darcID, Coin.decode(inst.value)))
        );
        return new CoinBS(await ObservableToBS(coinObs));
    }

    public async retrieveCredentialSignerBS(credStructBS: CredentialStructBS): Promise<CredentialSignerBS> {
        const signerDarcID = (await this.retrieveSignerIdentityDarc(credStructBS.darcID)).id;
        const darcBS = await this.retrieveDarcBS(signerDarcID);
        Log.lvl3("getting devices");
        const devices = await this.retrieveCST(darcBS, credStructBS.credDevices, "device");
        Log.lvl3("getting recoveries");
        const recoveries = await this.retrieveCST(darcBS, credStructBS.credRecoveries, "recovery");
        return new CredentialSignerBS(darcBS, devices, recoveries);
    }

    public async retrieveCST(signerBS: DarcBS, cimbs: CredentialInstanceMapBS, prefix: string): Promise<CSTypesBS> {
        Log.lvl3("getting CS:", prefix);
        const aisbs = ConvertBS(cimbs, im => im.toInstanceIDs());
        return new CSTypesBS(signerBS, cimbs, prefix, await this.retrieveDarcsBS(aisbs));
    }

    public async retrieveCredentialStructBS(id: InstanceID): Promise<CredentialStructBS | undefined> {
        Log.lvl3("creating CredentialStruct from scratch:", id);
        try {
            const instBS = await this.bc.instanceObservable(id);
            const darcID = instBS.getValue().darcID;
            const credBS = ConvertBS(instBS, inst => CredentialStruct.decode(inst.value));
            return new CredentialStructBS(id, darcID, credBS);
        } catch (e) {
            Log.warn("couldn't get credStruct for", id);
            return undefined;
        }
    }

    public async retrieveDarcsBS(aisbs: BehaviorSubject<InstanceID[]>): Promise<DarcsBS> {
        Log.lvl3("getting darcsBS");
        const dbs = await ObservableToBS(aisbs.pipe(
            flatMap(ais => Promise.all(ais
                .map(iid => this.retrieveDarcBS(iid)))),
            map(dbs => dbs.filter(db => db !== undefined)),
        ));
        return new DarcsBS(dbs);
    }

    public async retrieveDarcBS(darcID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<DarcBS | undefined> {
        Log.lvl3("getting darcBS");
        if (darcID instanceof Buffer) {
            darcID = new BehaviorSubject(darcID);
        }
        const instObs = darcID.pipe(
            flatMap(id => this.bc.instanceObservable(id)),
            mergeAll(),
            catchError(err => {
                Log.error("caught error:", err);
                return of(undefined as Proof);
            }),
            map(inst => inst ? Darc.decode(inst.value) : undefined),
        );
        const bsDarc = await ObservableToBS(instObs);
        if (bsDarc.getValue() === undefined){
            return undefined;
        }
        return new DarcBS(bsDarc);
    }

    public async retrieveSignerIdentityDarc(darcID: InstanceID): Promise<IdentityDarc> {
        Log.lvl3("getting signerIdentityDarc");
        const credDarc = await this.retrieveDarcBS(darcID);
        return IdentityWrapper.fromString(credDarc.getValue().rules.getRule(Darc.ruleSign).getIdentities()[0]).darc;
    }
}


