/// <reference types="node" />
import { BehaviorSubject, Observable, ReplaySubject, Subject } from "rxjs";
import { Scalar } from "@dedis/kyber";
import { byzcoin } from "@dedis/cothority";
import { Instances } from "./instances";
import { IByzCoinAddTransaction } from "./interfaces";
declare type InstanceID = byzcoin.InstanceID;
export declare const ed25519: import("@dedis/kyber/dist/curve/edwards25519/curve").default;
export declare enum EAttributes {
    alias = "1-public:alias",
    email = "1-public:email",
    coinID = "1-public:coin",
    contacts = "1-public:contactsBuf",
    version = "1-public:version",
    structVersion = "1-public:structVersion",
    seed = "1-public:seedPub",
    spawner = "1-public:spawner",
    ltsID = "1-config:ltsID",
    ltsX = "1-config:ltsX",
    devInitial = "1-devices:initial"
}
export interface IUpdateCredential {
    name: EAttributes;
    value: string | InstanceID;
}
/**
 * Credential holds static methods that allow to setup instances for credentials.
 */
export declare class Credentials {
    private inst;
    readonly id: InstanceID;
    private cred;
    static readonly structVersionLatest = 2;
    static readonly urlRegistered = "https://pop.dedis.ch/qrcode/identity-2";
    static readonly urlUnregistered = "https://pop.dedis.ch/qrcode/unregistered-2";
    private attributeCache;
    private contactsCache;
    constructor(inst: Instances, id: InstanceID, cred: Subject<byzcoin.contracts.CredentialStruct>);
    static fromScratch(inst: Instances, id: InstanceID): Promise<Credentials>;
    attributeObservable(name: EAttributes): ReplaySubject<Buffer>;
    aliasObservable(): Observable<string>;
    emailObservable(): Observable<string>;
    coinIDObservable(): Observable<InstanceID>;
    contactsObservable(): Observable<BehaviorSubject<Credentials>[]>;
    updateCredentials(bc: IByzCoinAddTransaction, priv: Scalar, ...cred: IUpdateCredential[]): Promise<void>;
    addContact(bc: IByzCoinAddTransaction, priv: Scalar, id: InstanceID): Promise<void>;
    rmContact(bc: IByzCoinAddTransaction, priv: Scalar, id: InstanceID): Promise<void>;
}
/**
 * ContactList wraps a list of credentialIDs in a set to be able to do add,
 * rm, has and convert it back to a long buffer again.
 * As the existing sets will store happily Buffer.from("1") and
 * Buffer.from("1") twice, this class converts all buffer to hex-codes, and
 * then back again.
 */
export declare class ContactList {
    readonly set: Set<string>;
    constructor(contacts: Buffer | Set<string>);
    static fromCredentials(cred: Credentials): Promise<ContactList>;
    toBuffer(): Buffer;
    add(contact: InstanceID | string): void;
    rm(contact: InstanceID | string): void;
    has(contact: InstanceID | string): boolean;
}
export {};
