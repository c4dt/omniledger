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
import {CredentialObservable} from "./credentialObservable";
import {IByzCoinProof, IInstance, Instances, IProof, newIInstance} from "./instances";
import {ITest} from "./simulation";
import {IDataBase} from "./tempdb";

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

export class ByzCoinSimul implements IByzCoinProof {
    private globalState = new GlobalState();

    public async getProof(id: InstanceID): Promise<IProof> {
        const inst = this.globalState.getInstance(id);
        if (inst === undefined) {
            return new SimulProof(newIInstance(Buffer.alloc(32), Buffer.alloc(0)));
        }
        return new SimulProof(inst);
    }

    public async newTest(alias: string, db: IDataBase, inst: Instances): Promise<ITest> {
        // Create all parts of the test-user
        const genesisUser = CredentialObservable.genesisUser();
        const spawner = CredentialObservable.spawner(genesisUser);
        spawner.coinID = Buffer.from(randomBytes(32));
        spawner.spawnerID = Buffer.from(randomBytes(32));
        const user = CredentialObservable.newUser(alias, spawner.spawnerID);
        user.coinID = CredentialObservable.coinID(user.keyPair.pub);
        user.credID = CredentialsInstance.credentialIID(user.keyPair.pub.marshalBinary());
        Log.print("user-credID is:", user.credID);

        // Register all of this
        this.globalState.addInstances(
            newIInstance(spawner.spawnerID,
                Buffer.from(SpawnerStruct.encode(spawner.spawner).finish())),
            newIInstance(user.credID, user.cred.toBytes()));
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
    public blocks: Block[] = [new Block()];

    public getInstance(id: InstanceID): IInstance | undefined {
        return this.getLatest().getInstance(id);
    }

    public getLatest(): Block {
        return this.blocks[this.blocks.length - 1];
    }

    public addBlock() {
        this.blocks.push(new Block());
    }

    public addCoin(c: Coin, id: InstanceID, darcID: InstanceID) {
        const inst = newIInstance(id, c.toBytes());
        inst.darcID = darcID;
        this.addInstance(inst);
    }

    public addDarc(d: Darc) {
        this.addInstance(newIInstance(d.getBaseID(), d.toBytes()));
    }

    public addInstance(inst: IInstance) {
        this.getLatest().addInstance(inst);
    }

    public addInstances(...insts: IInstance[]) {
        insts.forEach((inst) => this.addInstance(inst));
    }
}

class Block {
    public previous: Block | undefined;
    public instances = new Map<InstanceID, IInstance>();

    public getInstance(id: InstanceID): IInstance | undefined {
        Log.lvl2("Asking for instance", id);
        const inst = this.instances.get(id);
        if (inst !== undefined) {
            return inst;
        }
        if (this.previous !== undefined) {
            return this.previous.getInstance(id);
        }
        return undefined;
    }

    public addInstance(inst: IInstance) {
        Log.lvl2("Adding new instance", inst.key);
        const old = this.getInstance(inst.key);
        if (old !== undefined) {
            inst.version = old.version;
        } else {
            inst.version = Long.fromNumber(0);
        }
        this.instances.set(inst.key, inst);
    }
}
