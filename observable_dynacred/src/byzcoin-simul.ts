// tslint:disable:max-classes-per-file

import {InstanceID, Proof} from "@dedis/cothority/byzcoin";
import {Coin} from "@dedis/cothority/byzcoin/contracts/coin-instance";
import {Darc} from "@dedis/cothority/darc";
import CredentialsInstance from "@dedis/cothority/personhood/credentials-instance";
import {SpawnerStruct} from "@dedis/cothority/personhood/spawner-instance";
import {randomBytes} from "crypto-browserify";
import Long = require("long");
import {Credential} from "./credential";
import {Instances} from "./instances";
import {ITest} from "./simulation";
import {IDataBase} from "./tempdb";

export interface IByzCoinProof {
    getProof(inst: InstanceID): Promise<Proof>;
}

export class ByzCoinSimul implements IByzCoinProof {
    private globalState = new GlobalState();

    public async getProof(inst: InstanceID): Promise<Proof> {
        return Promise.reject("not implemented");
    }

    public async newTest(alias: string, db: IDataBase, inst: Instances): Promise<ITest> {
        // Create all parts of the test-user
        const genesisUser = Credential.genesisUser();
        const spawner = Credential.spawner(genesisUser);
        spawner.coinID = Buffer.from(randomBytes(32));
        spawner.spawnerID = Buffer.from(randomBytes(32));
        const user = Credential.newUser(alias, spawner.spawnerID);
        user.coinID = Credential.coinID(user.keyPair.pub);
        user.credID = CredentialsInstance.credentialIID(user.keyPair.pub.marshalBinary());

        // Register all of this
        this.globalState.addInstances({
            key: spawner.spawnerID,
            value: Buffer.from(SpawnerStruct.encode(spawner.spawner).finish()),
        }, {
            key: user.credID,
            value: user.cred.toBytes(),
        });
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
        this.addInstance({
            darcID,
            key: id,
            value: c.toBytes(),
        });
    }

    public addDarc(d: Darc) {
        this.addInstance({
            key: d.baseID,
            value: d.toBytes(),
        });
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
        const old = this.getInstance(inst.key);
        if (old !== undefined) {
            inst.version = old.version;
        } else {
            inst.version = Long.fromNumber(0);
        }
        this.instances.set(inst.key, inst);
    }
}

interface IInstance {
    key: InstanceID;
    value: Buffer;
    version?: Long;
    darcID?: InstanceID;
}
