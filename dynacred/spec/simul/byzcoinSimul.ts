// tslint:disable:max-classes-per-file

import { createHash } from "crypto-browserify";
import { BehaviorSubject, of, Subject } from "rxjs";
import { catchError, distinctUntilChanged, filter, map, mergeMap, tap } from "rxjs/operators";

import { Log } from "@dedis/cothority";
import {
  ClientTransaction,
  CONFIG_INSTANCE_ID,
  InstanceID,
  Instruction,
  IStorage,
  StateChangeBody,
} from "@dedis/cothority/byzcoin";
import {
  Coin,
  CoinInstance,
  CredentialsInstance,
  DarcInstance,
  SpawnerInstance,
  SpawnerStruct,
} from "@dedis/cothority/byzcoin/contracts";
import { AddTxResponse } from "@dedis/cothority/byzcoin/proto/requests";
import { Darc, IIdentity } from "@dedis/cothority/darc";
import IdentityWrapper from "@dedis/cothority/darc/identity-wrapper";
import { SkipBlock } from "@dedis/cothority/skipchain";

import Long = require("long");
import { IGenesisUser } from "src/genesis";
import { bufferToObject } from "src/utils";

export interface IInstance {
  key: InstanceID;
  value: Buffer;
  block: Long;
  contractID: string;
  version: Long;
  darcID: InstanceID;
}

export function newIInstance(key: InstanceID, value: Buffer, contractID?: string): IInstance {
  return {
    block: Long.fromNumber(-1),
    contractID: contractID || "unknown",
    darcID: Buffer.alloc(32),
    key, value,
    version: Long.fromNumber(0),
  };
}

class SimulProof {
  latest: SkipBlock;
  stateChangeBody: StateChangeBody;
  contractID: string;
  darcID: InstanceID;
  value: Buffer;
  version: Long;

  constructor(public inst: IInstance) {
    this.latest = new SkipBlock({ index: inst.block.toNumber() });
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

  get key(): InstanceID {
    return this.inst.key;
  }

  exists(key: Buffer): boolean {
    return this.inst.key.equals(key);
  }
}

export class ByzCoinSimul {
  // getProofObserver is used by the tests to check whether a proof is
  // requested at the right moment.
  readonly getProofObserver = new Subject<IInstance>();

  private globalState = new GlobalState();
  private blocks = new Blocks();

  private cache = new Map<InstanceID, BehaviorSubject<SimulProof>>();

  constructor(private db: IStorage, igd: IGenesisUser) {
    this.globalState.addDarc(igd.darc);
    this.globalState.addOrUpdateInstance(newIInstance(CONFIG_INSTANCE_ID,
      Buffer.alloc(0), "config"));
  }

  async sendTransactionAndWait(tx: ClientTransaction, wait?: number)
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
          throw new Error(`Don't know how to ${instr.type}`);
      }
    }
    this.blocks.addBlock();
    return undefined;
  }

  async invoke(instr: Instruction) {
    const i = instr.invoke;
    const arg = (name: string) =>
      (i.args.find((a) => a.name === name) || { value: undefined }).value;
    Log.lvl3("Invoke contract", i.contractID, i.command, instr.instanceID);
    switch (i.contractID) {
      case CredentialsInstance.contractID:
        const inv = i;
        if (inv.contractID !== CredentialsInstance.contractID ||
          inv.command !== CredentialsInstance.commandUpdate ||
          inv.args.length !== 1 ||
          inv.args[0].name !== CredentialsInstance.argumentCredential) {
          throw new Error("know only how to update" +
            " credential");
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
        switch (i.command) {
          case CoinInstance.commandMint:
            ci.value = ciCoinsNbr;
            ciInst.value = ci.toBytes();
            this.globalState.addOrUpdateInstance(ciInst);
            break;
          case CoinInstance.commandFetch:
            Log.lvl3("coin fetch is just ignored");
            break;
          default:
            throw new Error(`Don't know how to coin.${i.command}`);
        }
        break;
      case DarcInstance.contractID:
        switch (i.command) {
          case DarcInstance.commandEvolve:
          case DarcInstance.commandEvolveUnrestricted:
            const diInst = this.globalState.getInstance(instr.instanceID);
            if (!diInst) {
              throw new Error("didn't find this darc-instance");
            }
            diInst.value = arg(DarcInstance.argumentDarc);
            this.globalState.addOrUpdateInstance(diInst);
            break;
        }
        break;
      default:
        throw new Error(`Don't know how to invoke ${i.contractID}`);
    }
  }

  async getProofFromLatest(id: InstanceID): Promise<SimulProof> {
    Log.lvl3("Getting proof for", id);
    // Have some delay to mimic network setup.
    await new Promise((resolve) => setTimeout(resolve, 5));
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
  async getSignerCounters(signers: IIdentity[], increment: number): Promise<Long[]> {
    return this.updateCachedCounters(signers);
  }

  async updateCachedCounters(signers: IIdentity[]): Promise<Long[]> {
    return signers.map(() => Long.fromNumber(1));
  }

  getNextCounter(signer: IIdentity): Long {
    return Long.fromNumber(1);
  }

  getProtocolVersion(): number {
    return 3;
  }

  async checkAuthorization(byzCoinID: InstanceID, darcID: InstanceID,
                           ...identities: IdentityWrapper[]): Promise<string[]> {
    return [""];
  }

  async getNewBlocks(): Promise<BehaviorSubject<SkipBlock>> {
    const newBlocks = new BehaviorSubject(this.blocks.getLatestSkipBlock());
    this.blocks.newBlock.pipe(
      map(() => this.blocks.getLatestSkipBlock()),
    ).subscribe(newBlocks);
    return newBlocks;
  }

  async instanceObservable(id: InstanceID): Promise<BehaviorSubject<SimulProof>> {
    const proofBS = this.cache.get(id);
    if (proofBS !== undefined) {
      return proofBS;
    }

    // Check if the db already has a version, which might be outdated,
    // but still better than to wait for the network.
    // might be old, but be informed as soon as the correct values arrive.
    // This makes it possible to have a quick display of values that
    const idStr = id.toString("hex");

    const proofBuf = await this.db.get(id.toString("hex"));
    const simulProof = proofBuf ? new SimulProof(bufferToObject(proofBuf)) :
      await this.getProofFromLatest(id);

    // Create a new BehaviorSubject with the proof, which might not be
    // current, but a best guess from the db of a previous session.
    const bsNew = new BehaviorSubject(simulProof);
    this.cache.set(id, bsNew);

    // Set up a pipe from the block to fetch new versions if a new block
    // arrives.
    // Start with an observable that emits each new block as it arrives.
    (await this.getNewBlocks())
      .pipe(
        // Make sure only newer blocks than the proof are taken into
        // account
        filter((block) => block.index > simulProof.latest.index),
        // Get a new proof of the instance
        mergeMap(() => this.getProofFromLatest(id)),
        // Handle errors by sending latest know proof
        catchError((err) => {
          Log.error("instanceBS: couldn't get new instance:", err);
          return of(simulProof);
        }),
        // Don't emit proofs that are already known
        distinctUntilChanged((a, b) =>
          a.stateChangeBody.version.equals(b.stateChangeBody.version)),
        // Store new proofs in the db for later use
        tap((proof) =>
          this.db.set(idStr, Buffer.from(JSON.stringify(proof.inst)))),
        // Debug output
        tap((proof) =>
            Log.lvl3(`Updating proof of ${proof.contractID} / ${proof.version} / ${proof.key.toString("hex")}`)),
        // Link to the BehaviorSubject
      ).subscribe(bsNew);

    // Return the BehaviorSubject - the pipe will continue to run in the
    // background and check if the proof changed on the emission of
    // every new block.
    return bsNew;
  }

  private async spawn(instr: Instruction) {
    const dst = this.globalState.getInstance(instr.instanceID);
    if (dst === undefined) {
      throw new Error("sent spawn to non-existing instance");
    }
    const isSI = dst.contractID === SpawnerInstance.contractID;
    const blockIndex = this.blocks.getLatestBlock().index;
    let darcID = dst.darcID;
    const s = instr.spawn;
    const arg = (name: string) =>
      (s.args.find((a) => a.name === name) || { value: undefined }).value;
    const ciid = (id: Buffer): InstanceID => {
      const sha = createHash("sha256");
      sha.update(id);
      return sha.digest();
    };
    let ciCA: InstanceID;
    switch (s.contractID) {
      case DarcInstance.contractID:
        const diValue = arg(isSI ? SpawnerInstance.argumentDarc : DarcInstance.argumentDarc);
        const d = Darc.decode(diValue);
        this.globalState.addOrUpdateInstance({
          block: blockIndex,
          contractID: DarcInstance.contractID,
          darcID: d.getBaseID(),
          key: d.getBaseID(),
          value: diValue,
          version: Long.fromNumber(0),
        });
        break;
      case CoinInstance.contractID:
        ciCA = instr.deriveId();
        const coinID = arg(isSI ? SpawnerInstance.argumentCoinID : CoinInstance.argumentCoinID);
        if (coinID !== undefined) {
          const fph = createHash("sha256");
          fph.update(CoinInstance.contractID);
          fph.update(coinID);
          ciCA = fph.digest();
        }
        const ciDID = arg(isSI ? SpawnerInstance.argumentDarcID : CoinInstance.argumentDarcID);
        if (ciDID !== undefined) {
          darcID = ciDID;
        }
        const ciType = arg(isSI ? SpawnerInstance.argumentCoinName : CoinInstance.argumentType);
        const valueBuf = arg(isSI ? SpawnerInstance.argumentCoinValue : CoinInstance.argumentCoins) || Buffer.alloc(0);
        const ciCoin = new Coin({
          name: ciType || ciid(Buffer.from("byzcoin")),
          value: Long.fromBytesLE(Array.from(valueBuf)),
        });
        this.globalState.addOrUpdateInstance({
          block: blockIndex,
          contractID: CoinInstance.contractID,
          darcID,
          key: ciCA,
          value: ciCoin.toBytes(),
          version: Long.fromNumber(0),
        });
        break;
      case SpawnerInstance.contractID:
        const siC = (cn: string) => Coin.decode(arg(cn));
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
          block: blockIndex,
          contractID: SpawnerInstance.contractID,
          darcID,
          key: instr.deriveId(),
          value: Buffer.from(SpawnerStruct.encode(siStruct).finish()),
          version: Long.fromNumber(0),
        });
        break;
      case CredentialsInstance.contractID:
        const ciDI = arg(isSI ? SpawnerInstance.argumentDarcID : CredentialsInstance.argumentDarcID);
        if (ciDI !== undefined) {
          darcID = ciDI;
        }
        ciCA = instr.deriveId();
        const ciCredID = arg(isSI ? SpawnerInstance.argumentCredID : CredentialsInstance.argumentCredID);
        if (ciCredID !== undefined) {
          const ciH = createHash("sha256");
          ciH.update(Buffer.from(CredentialsInstance.contractID));
          ciH.update(ciCredID);
          ciCA = ciH.digest();
        }
        this.globalState.addOrUpdateInstance({
          block: blockIndex,
          contractID: CredentialsInstance.contractID,
          darcID,
          key: ciCA,
          value: arg(isSI ? SpawnerInstance.argumentCredential : CredentialsInstance.argumentCredential),
          version: Long.fromNumber(0),
        });
        break;
      default:
        throw new Error(`Spawning ${s.contractID} not yet implemented`);
    }
  }
}

class GlobalState {
  instances = new Map<string, IInstance>();

  addCoin(c: Coin, id: InstanceID, darcID: InstanceID) {
    const inst = newIInstance(id, c.toBytes(), "Coin");
    inst.darcID = darcID;
    this.addOrUpdateInstance(inst);
  }

  addDarc(d: Darc) {
    this.addOrUpdateInstance(newIInstance(d.getBaseID(), d.toBytes(), "Darc"));
  }

  getInstance(id: InstanceID): IInstance | undefined {
    return this.instances.get(id.toString("hex"));
  }

  addOrUpdateInstance(inst: IInstance) {
    const old = this.getInstance(inst.key);
    if (old !== undefined) {
      inst.version = old.version.add(1);
    } else {
      Log.lvl3(`Creating contract '${inst.contractID}' with id ${inst.key.toString("hex")} and darcID ${inst.darcID.toString("hex")}`);
      inst.version = Long.fromNumber(0);
    }
    this.instances.set(inst.key.toString("hex"), inst);
  }

  addInstances(...insts: IInstance[]) {
    insts.forEach((inst) => this.addOrUpdateInstance(inst));
  }
}

class Block {
  previous: Block | undefined;
  index: Long;

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
  newBlock = new Subject<Block>();
  private blocks: Block[] = [new Block()];

  getLatestBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  getLatestSkipBlock(): SkipBlock {
    return new SkipBlock({ index: this.getLatestBlock().index.toNumber() });
  }

  addBlock() {
    const block = new Block(this.getLatestBlock());
    this.blocks.push(block);
    this.newBlock.next(block);
  }
}
