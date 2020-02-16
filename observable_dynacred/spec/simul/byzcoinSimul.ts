// tslint:disable:max-classes-per-file

import {Subject} from "rxjs";
import {byzcoin, Log, skipchain} from "@dedis/cothority";
import {IInstance, IProof, newIInstance} from "src/instances";
import {
    IByzCoinAddTransaction,
    IByzCoinBlockStreamer,
    IByzCoinProof
} from "src/interfaces";

import {IGenesisDarc} from "src/credentialFactory";
import {map} from "rxjs/operators";
import {AddTxResponse} from "@dedis/cothority/byzcoin/proto/requests";
import {
    Coin,
    CoinInstance,
    DarcInstance, SpawnerStruct
} from "@dedis/cothority/byzcoin/contracts";
import {
    ClientTransaction,
    InstanceID,
    Instruction,
    StateChangeBody
} from "@dedis/cothority/byzcoin";
import {SkipBlock} from "@dedis/cothority/skipchain";
import {
    CredentialsInstance,
    SpawnerInstance
} from "@dedis/cothority/personhood";
import {Darc, IIdentity} from "@dedis/cothority/darc";
import {createHash} from "crypto-browserify";
import Long = require("long");

class SimulProof {
    public latest: skipchain.SkipBlock;
    public stateChangeBody: byzcoin.StateChangeBody;
    public contractID: string;
    public darcID: InstanceID;
    public value: Buffer;
    public version: Long;

    constructor(private inst: IInstance) {
        this.latest = new SkipBlock({index: inst.block.toNumber()});
        this.contractID = inst.contractID;
        this.darcID = inst.darcID;
        this.value = inst.value;
        this.version = inst.version;
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

    constructor(igd: IGenesisDarc) {
        this.globalState.addDarc(igd.darc);
    }

    public async sendTransactionAndWait(tx: ClientTransaction, wait?: number)
        : Promise<AddTxResponse> {
        for (const instr of tx.instructions) {
            switch (instr.type) {
                case Instruction.typeInvoke:
                    await this.invoke(instr);
                    break;
                case Instruction.typeSpawn:
                    await this.spawn(instr);
                    break;
                default:
                    throw new Error(`Don't know how to ${instr.type}`)
            }
        }
        this.blocks.addBlock();
        return undefined;
    }

    public async invoke(instr: Instruction) {
        const i = instr.invoke;
        let arg = (name: string) =>
            (i.args.find(arg => arg.name == name) || {value: undefined}).value;
        switch (i.contractID) {
            case CredentialsInstance.contractID:
                const inv = i;
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
            case CoinInstance.contractID:
                const ciCoins = arg(CoinInstance.argumentCoins);
                const ciCoinsNbr = ciCoins ? Long.fromBytesLE(Array.from(ciCoins)) : Long.fromNumber(0);
                const ciInst = this.globalState.getInstance(instr.instanceID);
                const ci = Coin.decode(ciInst.value);
                switch(i.command){
                    case CoinInstance.commandMint:
                        ci.value = ciCoinsNbr;
                        ciInst.value = ci.toBytes();
                        this.globalState.addOrUpdateInstance(ciInst);
                        break;
                    case CoinInstance.commandFetch:
                        Log.warn("coin fetch is just ignored");
                        break;
                    default:
                        throw new Error(`Don't know how to coin.${i.command}`);
                }
                break;
            case DarcInstance.contractID:
                switch(i.command){
                    case DarcInstance.commandEvolve:
                    case DarcInstance.commandEvolveUnrestricted:
                        const diInst = this.globalState.getInstance(instr.instanceID);
                        diInst.value = arg(DarcInstance.argumentDarc);
                        this.globalState.addOrUpdateInstance(diInst);
                        break;
                }
                break;
            default:
                throw new Error(`Don't know how to invoke ${i.contractID}`);
        }
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

    public getProtocolVersion(): number {
        return 3;
    }

    getNewBlocks(): Subject<skipchain.SkipBlock> {
        const newBlocks = new Subject<skipchain.SkipBlock>();
        this.blocks.newBlock.pipe(
            map((block) => new skipchain.SkipBlock({index: block.index.toNumber()}))
        ).subscribe(newBlocks);
        return newBlocks;
    }

    private async spawn(instr: Instruction) {
        // TODO: calling this actually on the correct contract-type from
        // instr.instanceID
        const dst = this.globalState.getInstance(instr.instanceID);
        if (dst === undefined) {
            throw new Error("sent spawn to non-existing instance");
        }
        const blockIndex = this.blocks.getLatestBlock().index;
        let darcID = dst.darcID;
        const s = instr.spawn;
        const arg = (name: string) =>
            (s.args.find(arg => arg.name == name) || {value: undefined}).value;
        const ciid = (id: Buffer): InstanceID => {
            const sha = createHash("sha256");
            sha.update(id);
            return sha.digest();
        };
        switch (s.contractID) {
            case DarcInstance.contractID:
                const diValue = arg(DarcInstance.argumentDarc);
                const d = Darc.decode(diValue);
                this.globalState.addOrUpdateInstance({
                    key: d.getBaseID(),
                    value: diValue,
                    block: blockIndex,
                    contractID: DarcInstance.contractID,
                    version: Long.fromNumber(0),
                    darcID: d.getBaseID()
                });
                break;
            case CoinInstance.contractID:
                let ciCA = instr.deriveId();
                let coinID = arg("public");
                if (coinID === undefined) {
                    coinID = arg(CoinInstance.argumentCoinID)
                }
                if (coinID !== undefined) {
                    const fph = createHash("sha256");
                    fph.update(CoinInstance.contractID);
                    fph.update(coinID);
                    ciCA = fph.digest();
                }
                const ciDID = arg(CoinInstance.argumentDarcID);
                if (ciDID !== undefined) {
                    darcID = ciDID;
                }
                const ciType = arg(CoinInstance.argumentType);
                const ciCoin = new Coin({
                    name: ciType || ciid(Buffer.from("byzcoin")),
                    value: Long.fromNumber(0),
                });
                this.globalState.addOrUpdateInstance({
                    key: ciCA,
                    value: ciCoin.toBytes(),
                    block: blockIndex,
                    contractID: CoinInstance.contractID,
                    version: Long.fromNumber(0),
                    darcID: darcID,
                });
                break;
            case SpawnerInstance.contractID:
                const siC = (cn: string) => new Coin({
                    value: Long.fromBytesLE(Array.from(arg(cn))),
                    name:ciid(Buffer.from("byzcoin")),
                });
                const siStruct = new SpawnerStruct({
                    costCRead: siC("costCRead"),
                    costCWrite: siC("costCWrite"),
                    costCoin: siC("costCoin"),
                    costCredential: siC("costCredential"),
                    costDarc: siC("costDarc"),
                    costParty: siC("costParty"),
                    costRoPaSci: siC("costRoPaSci"),
                    costValue: siC("costValue"),
                });
                this.globalState.addOrUpdateInstance({
                    key: instr.deriveId(),
                    value: Buffer.from(SpawnerStruct.encode(siStruct).finish()),
                    block: blockIndex,
                    contractID: SpawnerInstance.contractID,
                    version: Long.fromNumber(0),
                    darcID: darcID,
                });
                break;
            case CredentialsInstance.contractID:
                const ciDI = arg(SpawnerInstance.argumentDarcID);
                if (ciDI !== undefined){
                    darcID = ciDI;
                }
                ciCA = instr.deriveId();
                const ciCredID = arg("credID");
                if (ciCredID !== undefined){
                    const ciH = createHash("sha256");
                    ciH.update(Buffer.from(CredentialsInstance.contractID));
                    ciH.update(ciCredID);
                    ciCA = ciH.digest();
                }
                this.globalState.addOrUpdateInstance({
                    key: ciCA,
                    value: arg(CredentialsInstance.argumentCredential),
                    block: blockIndex,
                    contractID: CredentialsInstance.contractID,
                    version: Long.fromNumber(0),
                    darcID: darcID,
                });
                break;
            default:
                throw new Error(`Spawning ${s.contractID} not yet implemented`);
        }
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
