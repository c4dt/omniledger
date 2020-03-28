import Long from "long";

import {Argument, ByzCoinRPC, ClientTransaction, InstanceID, Instruction} from "@dedis/cothority/byzcoin";
import {
    Coin,
    CoinInstance,
    CredentialsInstance,
    CredentialStruct,
    DarcInstance,
    SPAWNER_COIN,
    SpawnerInstance
} from "@dedis/cothority/byzcoin/contracts";
import {Log} from "@dedis/cothority/index";
import {AddTxResponse} from "@dedis/cothority/byzcoin/proto/requests";
import {Darc, IIdentity} from "@dedis/cothority/darc";

import {ICoin} from "./genesis";
import {EAttributesPublic, ECredentials} from "./credentialStructBS";
import {UserSkeleton} from "./userSkeleton";
import {Transaction} from "./byzcoin";
import {CalypsoReadInstance, CalypsoWriteInstance, LongTermSecret, Read, Write} from "@dedis/cothority/calypso";
import {createCipheriv, randomBytes} from "crypto-browserify";
import {Point} from "@dedis/kyber/index";

export class CredentialTransaction extends Transaction {
    private cost = Long.fromNumber(0);

    constructor(public bc: ByzCoinRPC, private spawner: SpawnerInstance, private coin: ICoin) {
        super(bc);
    }

    public clone(): CredentialTransaction {
        return new CredentialTransaction(this.bc, this.spawner, this.coin);
    }

    public async sendCoins(wait = 0): Promise<[ClientTransaction, AddTxResponse]> {
        if (this.cost.greaterThan(0)) {
            this.unshift(Instruction.createInvoke(this.coin.instance.id, CoinInstance.contractID, CoinInstance.commandFetch,
                [new Argument({
                    name: CoinInstance.argumentCoins,
                    value: Buffer.from(this.cost.toBytesLE())
                })]));
        }
        return this.send([this.coin.signers], wait);
    }

    public spawnDarc(d: Darc): Darc {
        this.spawn(this.spawner.id, DarcInstance.contractID,
            [new Argument({name: SpawnerInstance.argumentDarc, value: d.toBytes()})]);
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

        this.spawn(this.spawner.id, CoinInstance.contractID,
            [new Argument({name: SpawnerInstance.argumentCoinName, value: type}),
                new Argument({name: SpawnerInstance.argumentDarcID, value: darcID}),
                new Argument({name: SpawnerInstance.argumentCoinID, value: coinID}),
                new Argument({name: SpawnerInstance.argumentCoinValue, value: Buffer.from(initial.toBytesLE())})
            ]);
        this.cost = this.cost.add(this.spawner.costs.costCoin.value.add(initial));
        return CoinInstance.create(this.bc, CoinInstance.coinIID(coinID),
            darcID, new Coin({name: type, value: initial}));
    }

    public spawnCredential(cred: CredentialStruct, darcID: InstanceID, credID?: InstanceID) {
        if (!credID) {
            credID = cred.getAttribute(ECredentials.pub, EAttributesPublic.seedPub);
        }
        this.spawn(this.spawner.id, CredentialsInstance.contractID,
            [new Argument({name: SpawnerInstance.argumentCredID, value: credID}),
                new Argument({name: SpawnerInstance.argumentDarcID, value: darcID}),
                new Argument({name: SpawnerInstance.argumentCredential, value: cred.toBytes()})]);
        this.cost = this.cost.add(this.spawner.costs.costCredential.value);
    }

    public spawnCalypsoWrite(darcID: InstanceID, wr: Write) {
        this.spawn(
            this.spawner.id,
            CalypsoWriteInstance.contractID,
            [
                new Argument({
                    name: CalypsoWriteInstance.argumentWrite,
                    value: Buffer.from(Write.encode(wr).finish())
                }),
                new Argument({
                    name: CalypsoWriteInstance.argumentDarcID,
                    value: darcID
                })]);
        this.cost = this.cost.add(this.spawner.costs.costCWrite.value);
    }

    public spawnCalypsoRead(wrID: InstanceID, pub: Point) {
        const read = new Read({write: wrID, xc: pub.marshalBinary()});
        this.spawn(
            wrID,
            CalypsoReadInstance.contractID,
            [new Argument({
                name: CalypsoReadInstance.argumentRead,
                value: Buffer.from(Read.encode(read).finish()),
            }),
            ]
        )
        this.cost = this.cost.add(this.spawner.costs.costCRead.value);
    }

    public createUser(user: UserSkeleton, initial = Long.fromNumber(0)) {
        Log.lvl3("Spawning darcs");
        [user.darcSign, user.darcDevice, user.darcCred, user.darcCoin].forEach(d => this.spawnDarc(d));

        Log.lvl3("Spawning coin");
        this.spawnCoin(SPAWNER_COIN, user.darcCoin.getBaseID(), user.keyPair.pub.marshalBinary(), initial);

        Log.lvl3("Spawning credential with darcID", user.darcCred.getBaseID());
        this.spawnCredential(user.cred, user.darcCred.getBaseID());
    }
}
