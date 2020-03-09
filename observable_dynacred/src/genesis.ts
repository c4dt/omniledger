import {BasicStuff} from "./user";
import {CoinInstance, DarcInstance, SPAWNER_COIN, SpawnerInstance} from "@dedis/cothority/byzcoin/contracts";
import {curve, Scalar} from "@dedis/kyber";
import {KeyPair} from "./keypair";
import {darc} from "@dedis/cothority";
import {ByzCoinRPC, InstanceID} from "@dedis/cothority/byzcoin";
import {IDataBase} from "./interfaces";
import {Instances} from "./instances";
import Log from "@dedis/cothority/log";
import ISigner from "@dedis/cothority/darc/signer";
import Long from "long";
import {Rule, SignerEd25519} from "@dedis/cothority/darc";
import {TempDB} from "./tempdb";

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

export class Genesis {
    public static readonly rules = ["spawn:spawner", "spawn:coin", "spawn:credential", "spawn:longTermSecret",
        "spawn:calypsoWrite", "spawn:calypsoRead", "spawn:darc",
        "invoke:coin.mint", "invoke:coin.transfer", "invoke:coin.fetch"];
    public bs?: BasicStuff;
    public spawner?: SpawnerInstance;
    public coin?: ICoin;
    public genesisUser?: IGenesisUser;

    constructor(
        args?: {
            bs?: BasicStuff,
            spawner?: SpawnerInstance,
            coin?: ICoin,
            genesisUser?: IGenesisUser
        }
    ) {
        if (args) {
            this.bs = args.bs;
            this.spawner = args.spawner;
            this.coin = args.coin;
            this.genesisUser = args.genesisUser;
        }
    }

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

    public createGenesisDarc(priv?: Scalar): IGenesisUser {
        const keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [keyPair.signer()];
        const adminDarc = darc.Darc.createBasic(signer, signer, Buffer.from("AdminDarc"), Genesis.rules);
        this.genesisUser = {keyPair, darc: adminDarc};
        return this.genesisUser;
    }

    public async evolveGenesisDarc() {
        const di = await DarcInstance.fromByzcoin(this.bs.bc, this.genesisUser.darcID);
        const newDarc = di.darc.evolve();
        Genesis.rules.forEach(rule => newDarc.rules.appendToRule(rule, this.genesisUser.keyPair.signer(), Rule.OR));
        await di.evolveDarcAndWait(newDarc, [this.genesisUser.keyPair.signer()], 10);
    }

    async createByzCoin(createBC: (igd: IGenesisUser) => Promise<ByzCoinRPC>,
                        db?: IDataBase): Promise<BasicStuff> {
        if (!this.genesisUser) {
            this.createGenesisDarc();
        }
        if (!db) {
            db = new TempDB();
        }
        const bc = await createBC(this.genesisUser);
        const inst = await Instances.fromScratch(db, bc);
        this.bs = new BasicStuff(bc, db, inst);
        return undefined;
    }

    async createCoin(): Promise<ICoin> {
        if (!this.bs) {
            throw new Error("cannot create coin without having byzcoin. Call createByzCoin first");
        }
        if (!this.genesisUser) {
            throw new Error("cannot create coin without a genesisUser")
        }
        const instance = await CoinInstance.spawn(this.bs.bc, this.darcID, this.signers, SPAWNER_COIN);
        await instance.mint(this.signers, Long.fromNumber(1e9));
        this.coin = {instance, signers: this.signers};
        return this.coin;
    }

    async createSpawner(): Promise<SpawnerInstance> {
        if (!this.bs) {
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
            bc: this.bs.bc,
            darcID: this.darcID,
            signers: this.signers,
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
            beneficiary: this.coin.instance.id
        });
        return this.spawner;
    }
}
