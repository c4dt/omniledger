import { BehaviorSubject, of } from "rxjs";
import { catchError, flatMap, map, mergeAll } from "rxjs/operators";
import URL from "url-parse";

import { Log } from "@dedis/cothority";
import { ByzCoinRPC, Instance, InstanceID, IStorage, Proof } from "@dedis/cothority/byzcoin";
import {
    Coin,
    CoinInstance,
    CredentialsInstance,
    CredentialStruct,
    SpawnerInstance,
} from "@dedis/cothority/byzcoin/contracts";
import { Darc, IdentityDarc, IdentityWrapper } from "@dedis/cothority/darc";

import { LongTermSecret } from "@dedis/cothority/calypso";
import { ABActionsBS, ABContactsBS, ABGroupsBS, ActionBS, AddressBook } from "./addressBook";
import { CoinBS, DarcBS, DarcsBS } from "./byzcoin";
import { Calypso } from "./calypso";
import { CredentialSignerBS, CSTypesBS } from "./credentialSignerBS";
import { CredentialInstanceMapBS, CredentialPublic, CredentialStructBS } from "./credentialStructBS";
import { KeyPair } from "./keypair";
import { ConvertBS, ObservableToBS } from "./observableUtils";
import { User } from "./user";

/**
 * Fetcher implements convenience methods to get instances needed for a credential.
 * This class can retrieve different instances from a ByzCoin chain.
 * All methods retrieve the information from ByzCoin.
 *
 * The use of `dbBase` is to allow for different users in the same IStorage.
 */
export class Fetcher {

    constructor(public bc: ByzCoinRPC,
                public db: IStorage) {
    }

    async retrieveUser(credID: InstanceID, privBuf: Buffer,
                       dbBase = "main"): Promise<User> {
        Log.lvl3("getting credential struct BS", credID);
        const credStructBS = await this.retrieveCredentialStructBS(credID);
        const kpp = KeyPair.fromPrivate(privBuf);
        const auth = await this.bc.checkAuthorization(this.bc.genesisID, credStructBS.darcID,
            IdentityWrapper.fromIdentity(kpp.signer()));
        Log.lvl1("auth is:", auth);
        Log.lvl3("getting spawner");
        const spawnerInstanceBS = await ObservableToBS(credStructBS.credConfig.spawnerID.pipe(
            flatMap((id) => this.bc.instanceObservable(id)),
            catchError((err) => {
                Log.error(err);
                return Promise.resolve(new BehaviorSubject(
                    new Proof({})));
            }),
            mergeAll(),
            map((inst) => Buffer.from(JSON.stringify({
                contractID: inst.contractID, darcID: inst.darcID,
                data: inst.value, id: inst.key,
            }))),
            map((instBuf) => new SpawnerInstance(this.bc, Instance.fromBytes(instBuf))),
        ));
        Log.lvl3("getting coinBS");
        const coinBS = await this.retrieveCoinBS(credStructBS.credPublic.coinID);
        Log.lvl3("getting credentialSignerBS");
        const credSignerBS = await this.retrieveCredentialSignerBS(credStructBS);
        Log.lvl3("getting address book");
        const addressBook = await this.retrieveAddressBook(credStructBS.credPublic);
        const ltsID = credStructBS.credConfig.ltsID.getValue();
        let cal: Calypso | undefined;
        if (ltsID && ltsID.length === 32) {
            Log.lvl3("getting lts");
            try {
                const lts = await this.retrieveLTS(ltsID);
                cal = new Calypso(lts, credSignerBS.getValue().getBaseID(),
                    credStructBS.credCalypso);
            } catch (e) {
                Log.warn("Couldn't load LTS:", e);
            }
        }
        const user = new User(
            this.bc, this.db, kpp, dbBase, credStructBS, spawnerInstanceBS,
            coinBS, credSignerBS, addressBook, cal,
        );
        await user.save();
        return user;
    }

    async retrieveUserByEphemeral(ephemeral: KeyPair, dbBase = "main"): Promise<User> {
        Log.lvl3("getting credID");
        const credID = CredentialsInstance.credentialIID(ephemeral.pub.marshalBinary());
        const u = await this.retrieveUser(credID, ephemeral.priv.marshalBinary(), dbBase);
        await u.switchKey(ephemeral);
        return u;
    }

    async retrieveUserByURL(urlStr: string, dbBase = "main"): Promise<User> {
        Log.lvl3("getting user from url", urlStr);
        const url = new URL(urlStr, true);
        if (!url.pathname.includes(User.urlNewDevice)) {
            throw new Error("not a newDevice url: " + url.pathname);
        }
        if (!url.query.credentialIID ||
            !url.query.ephemeral) {
            throw new Error("need credentialIID and ephemeral");
        }
        const credID = Buffer.from(url.query.credentialIID, "hex");
        const ephemeralBuf = Buffer.from(url.query.ephemeral, "hex");
        if (credID.length !== 32) {
            throw new Error("credentialIID is not of length 32 bytes");
        }
        if (ephemeralBuf.length !== 32) {
            throw new Error("ephemeralBuf is not of length 32 bytes");
        }

        const u = await this.retrieveUser(credID, ephemeralBuf, dbBase);
        await u.switchKey(KeyPair.fromPrivate(ephemeralBuf));
        return u;
    }

    async retrieveUserByDB(dbBase = "main"): Promise<User> {
        Log.lvl3("getting key and credID from DB");
        const [privBuf, credID] = await this.retrieveUserKeyCredID(dbBase);
        return this.retrieveUser(credID, privBuf, dbBase);
    }

    async retrieveUserKeyCredID(dbBase = "main"): Promise<[Buffer, Buffer]> {
        const key = await this.db.get(`${dbBase}:${User.keyPriv}`);
        const credID = await this.db.get(`${dbBase}:${User.keyCredID}`);
        if (key && credID && key.length === 32 && credID.length === 32) {
            return [key, credID];
        }
        throw new Error("couldn't find correct key and/or credID at: " + dbBase);
    }

    async retrieveAddressBook(cp: CredentialPublic): Promise<AddressBook> {
        Log.lvl3("getting contacts");
        const contactBS = new ABContactsBS(cp.contacts,
            await ObservableToBS(cp.contacts.pipe(
                flatMap((ais) => Promise.all(ais.toInstanceIDs().map(
                    (id) => this.retrieveCredentialStructBS(id),
                ))),
                map((css) => css.filter((cs) => cs !== undefined)),
                ),
            ),
        );

        Log.lvl3("getting groups");
        const groupsBS = new ABGroupsBS(cp.groups,
            await this.retrieveDarcsBS(ConvertBS(cp.groups, (gr) => gr.toInstanceIDs())));

        Log.lvl3("getting actions");
        const actionsBS = new ABActionsBS(cp.actions,
            await ObservableToBS(cp.actions.pipe(
                flatMap((ais) => Promise.all(ais.toInstanceIDs().map(
                    (id) => this.retrieveDarcBS(id),
                ))),
                map((dbs) => dbs.filter((db) => db !== undefined)),
                map((dbs) => dbs.map((db) => new ActionBS(db))),
            )));
        return new AddressBook(contactBS, groupsBS, actionsBS);
    }

    async retrieveCoinBS(coinID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<CoinBS> {
        Log.lvl3("getting coinBS");
        if (Buffer.isBuffer(coinID)) {
            coinID = new BehaviorSubject(coinID);
        }
        const coinObs = coinID.pipe(
            flatMap((id) => this.bc.instanceObservable(id)),
            mergeAll(),
            map((inst) => CoinInstance.create(this.bc as any, inst.key, inst.darcID, Coin.decode(inst.value))),
        );
        return new CoinBS(await ObservableToBS(coinObs));
    }

    async retrieveCredentialSignerBS(credStructBS: CredentialStructBS): Promise<CredentialSignerBS> {
        const signerDarcID = (await this.retrieveSignerIdentityDarc(credStructBS.darcID)).id;
        const darcBS = await this.retrieveDarcBS(signerDarcID);
        Log.lvl3("getting devices");
        const devices = await this.retrieveCST(darcBS, credStructBS.credDevices, "device");
        Log.lvl3("getting recoveries");
        const recoveries = await this.retrieveCST(darcBS, credStructBS.credRecoveries, "recovery");
        return new CredentialSignerBS(darcBS, devices, recoveries);
    }

    async retrieveCST(signerBS: DarcBS, cimbs: CredentialInstanceMapBS, prefix: string): Promise<CSTypesBS> {
        Log.lvl3("getting CS:", prefix);
        const aisbs = ConvertBS(cimbs, (im) => im.toInstanceIDs());
        return new CSTypesBS(signerBS, cimbs, prefix, await this.retrieveDarcsBS(aisbs));
    }

    async retrieveCredentialStructBS(id: InstanceID): Promise<CredentialStructBS | undefined> {
        Log.lvl3("creating CredentialStruct from scratch:", id);
        try {
            const instBS = await this.bc.instanceObservable(id);
            const darcID = instBS.getValue().darcID;
            const credBS = ConvertBS(instBS, (inst) => CredentialStruct.decode(inst.value));
            return new CredentialStructBS(id, darcID, credBS);
        } catch (e) {
            Log.warn("couldn't get credStruct for", id, e);
            return undefined;
        }
    }

    async retrieveDarcsBS(aisbs: BehaviorSubject<InstanceID[]>): Promise<DarcsBS> {
        Log.lvl3("getting darcsBS");
        const darcs = await ObservableToBS(aisbs.pipe(
            flatMap((ais) => Promise.all(ais
                .map((iid) => this.retrieveDarcBS(iid)))),
            map((dbs) => dbs.filter((db) => db !== undefined)),
        ));
        return new DarcsBS(darcs);
    }

    async retrieveDarcBS(darcID: BehaviorSubject<InstanceID> | InstanceID):
        Promise<DarcBS | undefined> {
        Log.lvl3("getting darcBS");
        // Need to verify against Buffer here, which is the defined type of InstanceID.
        // Else typescript complains....
        if (Buffer.isBuffer(darcID)) {
            darcID = new BehaviorSubject(darcID);
        }
        const instObs = darcID.pipe(
            flatMap((id) => this.bc.instanceObservable(id)),
            mergeAll(),
            catchError((err) => {
                Log.error("caught error:", err);
                return of(undefined as Proof);
            }),
            map((inst) => (inst && inst.value && inst.value.length > 0) ?
                Darc.decode(inst.value) : undefined),
        );
        const bsDarc = await ObservableToBS(instObs);
        if (bsDarc.getValue() === undefined) {
            return undefined;
        }
        return new DarcBS(bsDarc);
    }

    async retrieveSignerIdentityDarc(credDarcID: InstanceID): Promise<IdentityDarc> {
        Log.lvl3("getting signerIdentityDarc");
        const credDarc = await this.retrieveDarcBS(credDarcID);
        return IdentityWrapper.fromString(credDarc.getValue().rules.getRule(Darc.ruleSign).getIdentities()[0]).darc;
    }

    async retrieveLTS(ltsid: InstanceID): Promise<LongTermSecret> {
        return LongTermSecret.fromService(this.bc, ltsid);
    }
}
