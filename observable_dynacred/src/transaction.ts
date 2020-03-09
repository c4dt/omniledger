import {Argument, ByzCoinRPC, ClientTransaction, InstanceID, Instruction} from "@dedis/cothority/byzcoin";
import {AddTxResponse} from "@dedis/cothority/byzcoin/proto/requests";
import {Darc, IIdentity} from "@dedis/cothority/darc";
import Long from "long";
import {
    Coin,
    CoinInstance,
    CredentialsInstance,
    CredentialStruct,
    DarcInstance,
    SPAWNER_COIN,
    SpawnerInstance
} from "@dedis/cothority/byzcoin/contracts";
import {CredentialStructBS, EAttributesPublic, ECredentials, IUpdateCredential} from "./credentialStructBS";
import {UserSkeleton} from "./userSkeleton";
import {Log} from "@dedis/cothority/index";
import {ICoin} from "./genesis";

export class Transaction {
    private instructions: Instruction[] = [];
    private cost = Long.fromNumber(0);

    constructor(private bc: ByzCoinRPC, private spawner: SpawnerInstance, private coin: ICoin) {
    }

    public async send(wait = 0): Promise<AddTxResponse> {
        const coinFetch = Instruction.createInvoke(this.coin.instance.id,
            CoinInstance.contractID, CoinInstance.commandFetch,
            [new Argument({name: CoinInstance.argumentCoins, value: Buffer.from(this.cost.toBytesLE())})]);
        const ctx = ClientTransaction.make(this.bc.getProtocolVersion(), coinFetch, ...this.instructions);
        await ctx.updateCountersAndSign(this.bc, [this.coin.signers]);
        return this.bc.sendTransactionAndWait(ctx, wait);
    }

    public spawnDarc(d: Darc): Darc {
        this.instructions.push(Instruction.createSpawn(this.spawner.id, DarcInstance.contractID,
            [new Argument({name: SpawnerInstance.argumentDarc, value: d.toBytes()})]));
        this.cost = this.cost.add(this.spawner.costs.costDarc.value);
        return d;
    }

    public spawnDarcBasic(desc: string, signers: IIdentity[]): Darc {
        return this.spawnDarc(Darc.createBasic(signers, signers, Buffer.from(desc)));
    }

    public spawnCoin(type: InstanceID, darcID: InstanceID, coinID: InstanceID = darcID, initial = Long.fromNumber(0)): CoinInstance {
        if (initial.greaterThan(0) && !type.equals(SPAWNER_COIN)) {
            throw new Error("can only transfer initial coins using SPAWNER_COIN");
        }

        this.instructions.push(Instruction.createSpawn(this.spawner.id, CoinInstance.contractID,
            [new Argument({name: SpawnerInstance.argumentCoinName, value: type}),
                new Argument({name: SpawnerInstance.argumentDarcID, value: darcID}),
                new Argument({name: SpawnerInstance.argumentCoinID, value: coinID}),
                new Argument({name: SpawnerInstance.argumentCoinValue, value: Buffer.from(initial.toBytesLE())})
            ]));
        this.cost = this.cost.add(this.spawner.costs.costCoin.value.add(initial));
        return CoinInstance.create(this.bc, CoinInstance.coinIID(coinID),
            darcID, new Coin({name: type, value: initial}));
    }

    public spawnCredential(cred: CredentialStruct, darcID: InstanceID, credID?: InstanceID) {
        if (!credID) {
            credID = cred.getAttribute(ECredentials.pub, EAttributesPublic.seedPub);
        }
        this.instructions.push(Instruction.createSpawn(this.spawner.id, CredentialsInstance.contractID,
            [new Argument({name: SpawnerInstance.argumentCredID, value: credID}),
                new Argument({name: SpawnerInstance.argumentDarcID, value: darcID}),
                new Argument({name: SpawnerInstance.argumentCredential, value: cred.toBytes()})]));
        this.cost = this.cost.add(this.spawner.costs.costCredential.value);
    }

    public createUser(user: UserSkeleton, initial = Long.fromNumber(0)) {
        Log.lvl3("Spawning darcs");
        [user.darcSign, user.darcDevice, user.darcCred, user.darcCoin].forEach(d => this.spawnDarc(d));

        Log.lvl3("Spawning coin");
        this.spawnCoin(SPAWNER_COIN, user.darcCoin.getBaseID(), user.keyPair.pub.marshalBinary(), initial);

        Log.lvl3("Spawning credential with darcID", user.darcCred.getBaseID());
        this.spawnCredential(user.cred, user.darcCred.getBaseID());
    }

    public setAttributes(csBS: CredentialStructBS, ...cred: IUpdateCredential[]) {
        const newCred = csBS.getValue();
        for (const c of cred) {
            if (c.value !== undefined) {
                let value = c.value instanceof Buffer ? c.value : Buffer.from(c.value);
                newCred.setAttribute(c.cred, c.attr, value);
            } else {
                newCred.deleteAttribute(c.cred, c.attr);
            }
        }
        this.instructions.push(Instruction.createInvoke(csBS.id, CredentialsInstance.contractID, CredentialsInstance.commandUpdate,
            [new Argument({name: CredentialsInstance.argumentCredential, value: newCred.toBytes()})]));
    }

    public invoke(iid: Buffer, contractID: string, command: string, args: Argument[]) {
        this.instructions.push(Instruction.createInvoke(iid, contractID, command, args));
    }

    public toString(): string {
        return this.instructions.map((inst, i) => {
            const t = ["Spawn", "Invoke", "Delete"][inst.type];
            let cid: string;
            let args: Argument[];
            switch (inst.type) {
                case Instruction.typeSpawn:
                    cid = inst.spawn.contractID;
                    args = inst.spawn.args;
                    break;
                case Instruction.typeInvoke:
                    cid = `${inst.invoke.contractID} / ${inst.invoke.command}`;
                    args = inst.invoke.args;
                    break;
                case Instruction.typeDelete:
                    cid = inst.delete.contractID;
                    args = [];
                    break;
            }
            return `${i}:  ${t} ${cid}: ${inst.instanceID.toString("hex")}\n\t` +
                args.map((kv) => `${kv.name}: ${kv.value.toString("hex")}`).join("\n\t");
        }).join("\n\n");
    }
}
