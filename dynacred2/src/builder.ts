import URL from "url-parse";
import {catchError, flatMap, map, mergeAll, tap} from "rxjs/operators";
import {BehaviorSubject} from "rxjs";

import {Log} from "@dedis/cothority/index";
import {Instance, InstanceID, Proof} from "@dedis/cothority/byzcoin";
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
import {ByzCoinBS} from "./byzCoinBS";
import {CoinBS} from "./byzcoin/coinBS";

export interface IMigrate {
    keyPersonhood?: string;
    keyIdentity: string;
    version: number;
    contact: IMigrateContact;
}

export interface IMigrateContact {
    credential: Buffer;
}

export class ByzCoinBuilder extends ByzCoinBS {

    constructor(bid: ByzCoinBS) {
        if (bid) {
            super(bid.bc, bid.db);
        }
    }

    public async retrieveAddressBook(cp: CredentialPublic): Promise<AddressBook> {
        Log.lvl3("getting contacts");
        const contactBS = new ABContactsBS(cp.contacts,
            await ObservableToBS(cp.contacts.pipe(
                flatMap(ais => Promise.all(ais.toInstanceIDs().map(
                    async (id) => this.retrieveCredentialStructBS(id)
                )))))
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
                map(dbs => dbs.map(db => new ActionBS(db)))
            )));
        return new AddressBook(contactBS, groupsBS, actionsBS);
    }

    public async retrieveUser(credID: InstanceID, privBuf: Buffer,
                              dbBase = "main"): Promise<User> {
        Log.llvl3("getting credential struct BS");
        const credStructBS = await this.retrieveCredentialStructBS(credID);
        const kpp = KeyPair.fromPrivate(privBuf);
        const auth = await this.bc.checkAuthorization(this.bc.genesisID, credStructBS.darcID,
            IdentityWrapper.fromIdentity(kpp.signer()));
        Log.print("authentication is:", auth);
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
            this, kpp, dbBase, credStructBS, spawnerInstanceBS, coinBS, credSignerBS, addressBook
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

    public async retrieveUserByMigration(): Promise<User | undefined> {
        try {
            Log.lvl3("trying to migrate");
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
                return this.retrieveUser(credID, Buffer.from(migrate.keyIdentity, "hex"));
            }
        } catch (e) {
            Log.lvl4("Nothing to migrate from", e)
        }
        return undefined;
    }

    public async retrieveUserByDB(base = "main"): Promise<User> {
        const user = await this.retrieveUserByMigration();
        if (user) {
            return user;
        }

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

    public async retrieveCredentialStructBS(id: InstanceID): Promise<CredentialStructBS> {
        Log.lvl3("creating CredentialStruct from scratch:", id);
        const instBS = await this.bc.instanceObservable(id);
        const darcID = instBS.getValue().darcID;
        const credBS = ConvertBS(instBS, inst => CredentialStruct.decode(inst.value));
        return new CredentialStructBS(id, darcID, credBS);
    }

    public async retrieveDarcsBS(aisbs: BehaviorSubject<InstanceID[]>): Promise<DarcsBS> {
        Log.lvl3("getting darcsBS");
        const dbs = await ObservableToBS(aisbs.pipe(
            flatMap(ais => Promise.all(ais
                .map(iid => this.retrieveDarcBS(iid))))));
        return new DarcsBS(dbs);
    }

    public async retrieveDarcBS(darcID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<DarcBS> {
        Log.lvl3("getting darcBS");
        if (darcID instanceof Buffer) {
            darcID = new BehaviorSubject(darcID);
        }
        const instObs = darcID.pipe(
            flatMap(id => this.bc.instanceObservable(id)),
            mergeAll(),
            map(inst => Darc.decode(inst.value)),
        );
        const bsDarc = await ObservableToBS(instObs);
        return new DarcBS(bsDarc);
    }

    public async retrieveSignerIdentityDarc(darcID: InstanceID): Promise<IdentityDarc> {
        Log.lvl3("getting signerIdentityDarc");
        const credDarc = await this.retrieveDarcBS(darcID);
        return IdentityWrapper.fromString(credDarc.getValue().rules.getRule(Darc.ruleSign).getIdentities()[0]).darc;
    }
}
