import Long from "long";

import { darc } from "@dedis/cothority";
import { ByzCoinRPC, InstanceID, IStorage, LocalCache } from "@dedis/cothority/byzcoin";
import { CoinInstance, DarcInstance, SPAWNER_COIN, SpawnerInstance } from "@dedis/cothority/byzcoin/contracts";
import { Rule, SignerEd25519 } from "@dedis/cothority/darc";
import ISigner from "@dedis/cothority/darc/signer";
import Log from "@dedis/cothority/log";
import { curve, Scalar } from "@dedis/kyber";

import { LongTermSecret } from "@dedis/cothority/calypso";
import { Fetcher } from "./fetcher";
import { KeyPair } from "./keypair";
import { SpawnerTransactionBuilder } from "./spawnerTransactionBuilder";
import { User } from "./user";
import { UserSkeleton } from "./userSkeleton";

const ed25519 = new curve.edwards25519.Curve();

export interface IGenesisUser {
    keyPair: KeyPair;
    darc?: darc.Darc;
    darcID?: InstanceID;
}

export interface ICoin {
    instance: CoinInstance;
    signers: ISigner[];
}

export class Genesis extends Fetcher {

    get signers(): SignerEd25519[] {
        if (!this.genesisUser) {
            throw new Error("need genesisUser to create signer");
        }
        return [this.genesisUser.keyPair.signer()];
    }

    get darcID(): InstanceID {
        if (!this.genesisUser) {
            throw new Error("need genesisUser to create darcID");
        }
        return this.genesisUser.darcID || this.genesisUser.darc.getBaseID();
    }

    static readonly rules = ["spawn:spawner", "spawn:coin", "spawn:credential", "spawn:longTermSecret",
        "spawn:calypsoWrite", "spawn:calypsoRead", "spawn:darc",
        "invoke:coin.mint", "invoke:coin.transfer", "invoke:coin.fetch"];

    static async create(priv: Scalar, createBC: (igd: IGenesisUser, db: IStorage) => Promise<ByzCoinRPC>,
                        db?: IStorage): Promise<Genesis> {
        const keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [keyPair.signer()];
        const adminDarc = darc.Darc.createBasic(signer, signer, Buffer.from("AdminDarc"), Genesis.rules);
        if (!db) {
            db = new LocalCache();
        }
        const gu = { keyPair, darc: adminDarc };
        const bc = await createBC(gu, db);
        return new Genesis(db, bc, gu);
    }

    constructor(
        public db: IStorage,
        public bc: ByzCoinRPC,
        public genesisUser?: IGenesisUser,
        public spawner?: SpawnerInstance,
        public coin?: ICoin,
    ) {
        super(bc, db);
    }

    async evolveGenesisDarc() {
        const di = await DarcInstance.fromByzcoin(this.bc, this.genesisUser.darcID);
        const newDarc = di.darc.evolve();
        Genesis.rules.forEach((rule) => newDarc.rules.appendToRule(rule, this.genesisUser.keyPair.signer(), Rule.OR));
        await di.evolveDarcAndWait(newDarc, [this.genesisUser.keyPair.signer()], 10);
    }

    async createCoin(): Promise<ICoin> {
        if (!this.bc) {
            throw new Error("cannot create coin without having byzcoin. Call createByzCoin first");
        }
        if (!this.genesisUser) {
            throw new Error("cannot create coin without a genesisUser");
        }
        const instance = await CoinInstance.spawn(this.bc, this.darcID, this.signers, SPAWNER_COIN);
        await instance.mint(this.signers, Long.fromNumber(1e11));
        this.coin = { instance, signers: this.signers };
        return this.coin;
    }

    async createSpawner(): Promise<SpawnerInstance> {
        if (!this.bc) {
            throw new Error("cannot create spawner without having byzcoin. Call createByzCoin first");
        }
        if (!this.coin) {
            await this.createCoin();
        }

        Log.lvl3("Creating spawner instance");
        const coin10 = Long.fromNumber(10);
        const coin100 = Long.fromNumber(100);
        const coin1000 = Long.fromNumber(1000);
        this.spawner = await SpawnerInstance.spawn({
            bc: this.bc,
            beneficiary: this.coin.instance.id,
            costs: {
                costCRead: coin100,
                costCWrite: coin1000,
                costCoin: coin100,
                costCredential: coin1000,
                costDarc: coin100,
                costParty: coin1000,
                costRoPaSci: coin10,
                costValue: coin10,
            },
            darcID: this.darcID,
            signers: this.signers,
        });
        return this.spawner;
    }

    async createUser(alias = "1st user", priv?: Scalar, dbBase = "main", lts?: LongTermSecret): Promise<User> {
        if (!priv) {
            priv = KeyPair.rand().priv;
        }
        const userFactory = new UserSkeleton(alias, this.spawner.id, priv);
        const tx = new SpawnerTransactionBuilder(this.bc, this.spawner, this.coin);
        if (lts) {
            userFactory.addLTS(lts);
        }
        tx.createUser(userFactory, Long.fromNumber(1e9));
        await tx.sendCoins(SpawnerTransactionBuilder.longWait);
        return this.retrieveUser(userFactory.credID, userFactory.keyPair.priv.marshalBinary(), dbBase);
    }
}
