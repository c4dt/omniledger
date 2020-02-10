// tslint:disable:max-classes-per-file

import {Subject} from "rxjs";
import {byzcoin, darc, Log, personhood, skipchain} from "@dedis/cothority";
import {IInstance, IProof, newIInstance} from "src/instances";
import {
    IByzCoinAddTransaction,
    IByzCoinBlockStreamer,
    IByzCoinProof
} from "src/interfaces";

import {ITest} from "spec/simul/itest";
import {IUser} from "src/credentialFactory";
import {map} from "rxjs/operators";
import Long = require("long");

const {SkipBlock} = skipchain;
const {StateChangeBody, Instruction} = byzcoin;
const {SpawnerStruct, CredentialsInstance} = personhood;
type InstanceID = byzcoin.InstanceID;
type Darc = darc.Darc;
type IIdentity = darc.IIdentity;
type Coin = byzcoin.contracts.Coin;
type ClientTransaction = byzcoin.ClientTransaction;

class SimulProof {
    public latest: skipchain.SkipBlock;
    public stateChangeBody: byzcoin.StateChangeBody;

    constructor(private inst: IInstance) {
        this.latest = new SkipBlock({index: inst.block.toNumber()});
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

export class ByzCoinSimul implements IByzCoinProof, IByzCoinAddTransaction, IByzCoinBlockStreamer {
    public static configInstanceID: InstanceID = Buffer.alloc(32);

    // getProofObserver is used by the tests to check whether a proof is
    // requested at the right moment.
    public readonly getProofObserver = new Subject<IInstance>();

    private globalState = new GlobalState();
    private blocks = new Blocks();

    constructor(private test: ITest) {
    }

    static async fromScratch(t: ITest): Promise<ByzCoinSimul> {
        const bc = new ByzCoinSimul(t);
        await bc.storeTest();
        return bc;
    }

    public async sendTransactionAndWait(tx: ClientTransaction): Promise<void> {
        for (const instr of tx.instructions) {
            switch (instr.type) {
                case Instruction.typeInvoke:
                    const inv = instr.invoke;
                    Log.lvl3("Invoke contract", instr.instanceID);
                    if (inv.contractID !== CredentialsInstance.contractID ||
                        inv.command !== CredentialsInstance.commandUpdate ||
                        inv.args.length !== 1 ||
                        inv.args[0].name !== CredentialsInstance.argumentCredential) {
                        throw new Error("know only how to update" +
                            " credential")
                    }
                    const inst = this.globalState.getInstance(instr.instanceID);
                    if (inst === undefined) {
                        throw new Error("cannot update unknown instance");
                    }
                    inst.value = inv.args[0].value;
                    this.globalState.addOrUpdateInstance(inst);
                    break;
                default:
                    throw new Error("can only update")
            }
        }
        this.blocks.addBlock();
    }

    public async getProofFromLatest(id: InstanceID): Promise<IProof> {
        Log.lvl3("Getting proof for", id);
        // Have some delay to mimic network setup.
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

    public async storeTest() {
        this.globalState.addInstances(
            newIInstance(this.test.spawner.spawnerID,
                Buffer.from(SpawnerStruct.encode(this.test.spawner.spawner).finish()), "Spawner"),
            newIInstance(ByzCoinSimul.configInstanceID, Buffer.alloc(0), "Configuration"));
        this.globalState.addDarc(this.test.genesisUser.darc);
        this.globalState.addCoin(this.test.spawner.coin, this.test.spawner.coinID, this.test.genesisUser.darc.baseID);

        await this.storeUser(this.test.user);
    }

    public async storeUser(user: IUser) {
        this.globalState.addDarc(user.darcDevice);
        this.globalState.addDarc(user.darcSign);
        this.globalState.addDarc(user.darcCoin);
        this.globalState.addDarc(user.darcCred);
        this.globalState.addCoin(user.coin, user.coinID, user.darcSign.baseID);
        this.globalState.addInstances(
            newIInstance(user.credID, user.cred.toBytes(), "Credential")
        );
        this.blocks.addBlock();
    }

    // Dummy implementations with always-1 counters
    public async getSignerCounters(signers: IIdentity[], increment: number): Promise<Long[]> {
        return this.updateCachedCounters(signers);
    }

    public async updateCachedCounters(signers: IIdentity[]): Promise<Long[]> {
        return signers.map(() => Long.fromNumber(1));
    }

    public getNextCounter(signer: IIdentity): Long {
        return Long.fromNumber(1);
    }

    getNewBlocks(): Subject<skipchain.SkipBlock> {
        const newBlocks = new Subject<skipchain.SkipBlock>();
        this.blocks.newBlock.pipe(
            map((block) => new skipchain.SkipBlock({index: block.index.toNumber()}))
        ).subscribe(newBlocks);
        return newBlocks;
    }
}

class GlobalState {
    public instances = new Map<string, IInstance>();

    public addCoin(c: Coin, id: InstanceID, darcID: InstanceID) {
        const inst = newIInstance(id, c.toBytes(), "Coin");
        inst.darcID = darcID;
        this.addOrUpdateInstance(inst);
    }

    public addDarc(d: Darc) {
        this.addOrUpdateInstance(newIInstance(d.getBaseID(), d.toBytes(), "Darc"));
    }

    public getInstance(id: InstanceID): IInstance | undefined {
        return this.instances.get(id.toString("hex"));
    }

    public addOrUpdateInstance(inst: IInstance) {
        const old = this.getInstance(inst.key);
        if (old !== undefined) {
            inst.version = old.version.add(1);
        } else {
            inst.version = Long.fromNumber(0);
        }
        this.instances.set(inst.key.toString("hex"), inst);
    }

    public addInstances(...insts: IInstance[]) {
        insts.forEach((inst) => this.addOrUpdateInstance(inst));
    }
}

class Block {
    public previous: Block | undefined;
    public index: Long;

    constructor(b?: Block) {
        if (b !== undefined) {
            this.index = b.index.add(1);
            this.previous = b;
        } else {
            this.index = Long.fromNumber(0);
        }
    }
}

class Blocks {
    public newBlock = new Subject<Block>();
    private blocks: Block[] = [new Block()];

    public getLatestBlock(): Block {
        return this.blocks[this.blocks.length - 1];
    }

    public addBlock() {
        const block = new Block(this.getLatestBlock());
        this.blocks.push(block);
        this.newBlock.next(block);
    }
}
