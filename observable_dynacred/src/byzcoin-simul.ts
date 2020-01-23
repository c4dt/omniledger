// tslint:disable:max-classes-per-file

import {Log} from "@dedis/cothority";
import {InstanceID} from "@dedis/cothority/byzcoin";
import {Coin} from "@dedis/cothority/byzcoin/contracts/coin-instance";
import {StateChangeBody} from "@dedis/cothority/byzcoin/proof";
import {Darc} from "@dedis/cothority/darc";
import CredentialsInstance from "@dedis/cothority/personhood/credentials-instance";
import {SpawnerStruct} from "@dedis/cothority/personhood/spawner-instance";
import {SkipBlock} from "@dedis/cothority/skipchain";
import {randomBytes} from "crypto-browserify";
import Long = require("long");
import {IInstance, Instances, IProof, newIInstance} from "./instances";
import {ITest} from "./simulation";
import {IDataBase} from "./tempdb";
import {CredentialFactory} from "./credentialFactory";
import {User} from "./user";
import {ReplaySubject} from "rxjs";

export interface IByzCoinProof {
    getProof(inst: InstanceID): Promise<IProof>;
}

export interface IByzCoinAddTransaction {
    addTransaction(tx: ITransaction): Promise<void>;
}

export interface ITransaction{
    spawn?: ISpawnTransaction;
    update?: IUpdateTransaction;
    delete?: IDeleteTransaction;
}

export interface IUpdateTransaction{
    instID: InstanceID;
    value: Buffer;
}

export interface ISpawnTransaction{
    instID: InstanceID;
    value: Buffer;
}

export interface IDeleteTransaction{
    instID: InstanceID;
}

class SimulProof {
    public skipblock: SkipBlock;
    public stateChangeBody: StateChangeBody;

    constructor(private inst: IInstance) {
        this.skipblock = new SkipBlock({index: inst.block.toNumber()});
        this.stateChangeBody = new StateChangeBody({
            contractid: inst.contractID,
            darcid: inst.darcID,
            value: inst.value,
            version: inst.version,
        });
    }

    public exists(key: Buffer): boolean {
        return this.inst.key.equals(key);
    }
}

export class ByzCoinSimul implements IByzCoinProof, IByzCoinAddTransaction {
    public static configInstanceID: InstanceID = Buffer.alloc(32);

    public getProofObserver = new ReplaySubject<IInstance>(1);

    private globalState = new GlobalState();
    private blocks = new Blocks();

    public async addTransaction(tx: ITransaction): Promise<void>{
        if (tx.spawn !== undefined || tx.delete !== undefined || tx.update === undefined){
            throw new Error("can only update")
        }
        Log.lvl3("addTransaction", tx.update.instID);
        const inst = this.globalState.getInstance(tx.update.instID);
        if (inst === undefined){
            throw new Error("cannot update unknown instance");
        }
        inst.value = tx.update.value;
        this.globalState.addOrUpdateInstance(inst);
        this.blocks.addBlock();
    }

    public async getProof(id: InstanceID): Promise<IProof> {
        Log.lvl3("Getting proof for", id);
        // Have some delay to mimick network setup.
        await new Promise(resolve => setTimeout(resolve, 5));
        let inst = this.globalState.getInstance(id);
        if (inst === undefined) {
            inst = newIInstance(Buffer.alloc(32, 255), Buffer.alloc(0));
        }
        inst.block = this.blocks.getLatestBlock().index;
        const ip = new SimulProof(inst);
        this.getProofObserver.next(inst);
        return ip;
    }

    public async newTest(alias: string, db: IDataBase, inst: Instances): Promise<ITest> {
        // Create all parts of the test-user
        const genesisUser = CredentialFactory.genesisUser();
        const spawner = CredentialFactory.spawner(genesisUser);
        spawner.coinID = Buffer.from(randomBytes(32));
        spawner.spawnerID = Buffer.from(randomBytes(32));
        const user = CredentialFactory.newUser(alias, spawner.spawnerID);
        user.coinID = CredentialFactory.coinID(user.keyPair.pub);
        user.credID = CredentialsInstance.credentialIID(user.keyPair.pub.marshalBinary());
        await db.set(User.keyPriv, user.keyPair.priv.marshalBinary());
        await db.set(User.keyCredID, user.credID);

        // Register all of this
        this.globalState.addInstances(
            newIInstance(spawner.spawnerID,
                Buffer.from(SpawnerStruct.encode(spawner.spawner).finish()), "Spawner"),
            newIInstance(user.credID, user.cred.toBytes(), "Credential"),
            newIInstance(ByzCoinSimul.configInstanceID, Buffer.alloc(0), "Configuration"));
        this.globalState.addDarc(genesisUser.darc);
        this.globalState.addDarc(user.darcDevice);
        this.globalState.addDarc(user.darcSign);
        this.globalState.addDarc(user.darcCoin);
        this.globalState.addDarc(user.darcCred);
        this.globalState.addCoin(spawner.coin, spawner.coinID, genesisUser.darc.baseID);
        this.globalState.addCoin(user.coin, user.coinID, user.darcSign.baseID);

        return {genesisUser, spawner, user};
    }
}

class GlobalState {
    public instances = new Map<InstanceID, IInstance>();

    public addCoin(c: Coin, id: InstanceID, darcID: InstanceID) {
        const inst = newIInstance(id, c.toBytes(), "Coin");
        inst.darcID = darcID;
        this.addOrUpdateInstance(inst);
    }

    public addDarc(d: Darc) {
        this.addOrUpdateInstance(newIInstance(d.getBaseID(), d.toBytes(), "Darc"));
    }
    public getInstance(id: InstanceID): IInstance | undefined {
        return this.instances.get(id);
    }

    public addOrUpdateInstance(inst: IInstance) {
        const old = this.getInstance(inst.key);
        if (old !== undefined) {
            inst.version = old.version.add(1);
        } else {
            inst.version = Long.fromNumber(0);
        }
        this.instances.set(inst.key, inst);
    }

    public addInstances(...insts: IInstance[]) {
        insts.forEach((inst) => this.addOrUpdateInstance(inst));
    }
}

class Block {
    public previous: Block | undefined;
    public index: Long;

    constructor(b?: Block){
        if (b !== undefined){
            this.index = b.index.add(1);
            this.previous = b;
        } else {
            this.index = Long.fromNumber(0);
        }
    }
}

class Blocks{
    private blocks: Block[] = [new Block()];

    public getLatestBlock(): Block {
        return this.blocks[this.blocks.length - 1];
    }

    public addBlock() {
        this.blocks.push(new Block(this.getLatestBlock()));
    }
}
