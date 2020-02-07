/// <reference types="node" />
import { KeyPair } from "./keypair";
import { IByzCoinAddTransaction, IDataBase } from "./interfaces";
import { Credentials } from "./credentials";
import { Instances } from "./instances";
import { byzcoin } from "@dedis/cothority";
declare type InstanceID = byzcoin.InstanceID;
export interface IMigrate {
    keyPersonhood?: string;
    keyIdentity: string;
    version: number;
    contact: IMigrateContact;
}
export interface IMigrateContact {
    credential: Buffer;
}
export declare class User {
    private db;
    readonly credential: Credentials;
    kp: KeyPair;
    kpPersonhood?: KeyPair | undefined;
    static readonly keyPriv = "private";
    static readonly keyPersonhood = "personhood";
    static readonly keyCredID = "credID";
    static readonly keyMigrate = "storage/data.json";
    static readonly versionMigrate = 1;
    constructor(db: IDataBase, credential: Credentials, kp: KeyPair, kpPersonhood?: KeyPair | undefined);
    get id(): InstanceID;
    static migrate(db: IDataBase, inst: Instances): Promise<User | undefined>;
    static load(db: IDataBase, inst: Instances): Promise<User>;
    save(): Promise<void>;
    addContact(bc: IByzCoinAddTransaction, id: InstanceID): Promise<void>;
    rmContact(bc: IByzCoinAddTransaction, id: InstanceID): Promise<void>;
}
export {};
