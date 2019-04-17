import {createHash} from 'crypto';
import * as Long from 'long';
import {Message, Properties} from 'protobufjs/light';
import Darc from '../../darc/darc';
import Signer from '../../darc/signer';
import {Log} from '../../log';
import {registerMessage} from '../../protobuf';
import ByzCoinRPC from '../byzcoin-rpc';
import ClientTransaction, {Argument, Instruction} from '../client-transaction';
import Instance, {InstanceID} from '../instance';
import CoinInstance, {Coin} from './coin-instance';
import CredentialInstance, {CredentialStruct} from './credentials-instance';
import DarcInstance from './darc-instance';
import {PopPartyInstance} from '../../Personhood/pop-party-instance';
import {PopDesc} from '../../Personhood/proto';
import RoPaSciInstance, {RoPaSciStruct} from '../../Personhood/ro-pa-sci-instance';
import {CalypsoWriteInstance, Write} from '../../calypso/calypso-instance';
import {IIdentity} from '../../darc';
import {CreateLTSReply} from '../../calypso/calypso-rpc';

export const SPAWNER_COIN = Buffer.alloc(32, 0);
SPAWNER_COIN.write('SpawnerCoin');

export default class SpawnerInstance extends Instance {
    static readonly contractID = 'spawner';

    /**
     * Spawn a spawner instance
     *
     * @param bc The ByzCoinRPC to use
     * @param darcID The darc instance ID
     * @param signers The list of signers
     * @param costs The different cost for new instances
     * @param beneficiary The beneficiary of the costs
     */
    static async spawn(params: ICreateSpawner): Promise<SpawnerInstance> {
        const {bc, darcID, signers, costs, beneficiary} = params;

        const args = [
            ...Object.keys(costs).map((k) => {
                const value = new Coin({name: SPAWNER_COIN, value: costs[k]}).toBytes();
                return new Argument({name: k, value});
            }),
            new Argument({name: 'beneficiary', value: beneficiary}),
        ];

        const inst = Instruction.createSpawn(darcID, this.contractID, args);
        const ctx = new ClientTransaction({instructions: [inst]});
        await ctx.updateCountersAndSign(bc, [signers]);

        await bc.sendTransactionAndWait(ctx);

        return this.fromByzcoin(bc, inst.deriveId());
    }

    /**
     * Initializes using an existing coinInstance from ByzCoin
     *
     * @param bc
     * @param iid
     */
    static async fromByzcoin(bc: ByzCoinRPC, iid: InstanceID): Promise<SpawnerInstance> {
        const proof = await bc.getProof(iid);
        if (!proof.exists(iid)) {
            throw new Error('fail to get a matching proof');
        }

        return new SpawnerInstance(bc, await proof.getVerifiedInstance(bc.genesisID,
            SpawnerInstance.contractID));
    }

    private struct: SpawnerStruct;

    /**
     * Creates a new SpawnerInstance
     * @param bc        The ByzCoinRPC instance
     * @param iid       The instance ID
     * @param spawner   Parameters for the spawner: costs and names
     */
    constructor(private rpc: ByzCoinRPC, inst: Instance) {
        super(inst);
        if (inst.contractID.toString() !== SpawnerInstance.contractID) {
            throw new Error(`mismatch contract name: ${inst.contractID} vs ${SpawnerInstance.contractID}`);
        }

        this.struct = SpawnerStruct.decode(inst.data);
    }

    /**
     * Get the total cost required to sign up
     *
     * @returns the cost
     */
    get signupCost(): Long {
        return this.struct.costCoin.value
            .add(this.struct.costDarc.value)
            .add(this.struct.costCredential.value);
    }

    /**
     * Update the data of this instance
     *
     * @returns a promise that resolves once the data is up-to-date
     */
    async update(): Promise<SpawnerInstance> {
        const proof = await this.rpc.getProof(this.id);
        this.struct = SpawnerStruct.decode(proof.value);
        return this;
    }

    /**
     * Create a darc for a user
     *
     * @param coin      The coin instance to take coins from
     * @param signers   The signers for the transaction
     * @param pubKey    public key of the user
     * @param alias     Name of the user
     * @returns a promise that resolves with the new darc instance
     */
    async spawnDarc(coin: CoinInstance, signers: Signer[], ...darcs: Darc[]): Promise<DarcInstance[]> {
        // const d = SpawnerInstance.prepareUserDarc(pubKey, alias);
        let cost = this.struct.costDarc.value.mul(darcs.length);
        const ctx = new ClientTransaction({
            instructions: [
                Instruction.createInvoke(
                    coin.id,
                    CoinInstance.contractID,
                    'fetch',
                    [new Argument({name: 'coins', value: Buffer.from(cost.toBytesLE())})],
                )
            ],
        });
        darcs.forEach(darc => {
            ctx.instructions.push(
                Instruction.createSpawn(
                    this.id,
                    DarcInstance.contractID,
                    [new Argument({name: 'darc', value: darc.toBytes()})],
                ));
        });
        await ctx.updateCountersAndSign(this.rpc, [signers]);

        await this.rpc.sendTransactionAndWait(ctx);

        let dis = [];
        for (let i = 0; i < darcs.length; i++) {
            dis.push(await DarcInstance.fromByzcoin(this.rpc, darcs[i].getBaseID()));
        }
        return dis;
    }

    /**
     * Create a coin instance for a given darc
     *
     * @param coin      The coin instance to take the coins from
     * @param signers   The signers for the transaction
     * @param darcID    The darc responsible for this coin
     * @param coinID    The instance-ID for the coin - will be calculated as sha256("coin" | coinID)
     * @param balance   The starting balance
     * @returns a promise that resolves with the new coin instance
     */
    async spawnCoin(coin: CoinInstance, signers: Signer[], darcID: InstanceID, coinID: Buffer, balance?: Long): Promise<CoinInstance> {
        try {
            const ci = await CoinInstance.fromByzcoin(this.rpc, CoinInstance.coinIID(coinID));
            Log.warn('this coin is already registered');
            return ci;
        } catch (e) {
            // doesn't exist
        }

        balance = balance || Long.fromNumber(0);
        const valueBuf = this.struct.costCoin.value.add(balance).toBytesLE();
        const ctx = new ClientTransaction({
            instructions: [
                Instruction.createInvoke(
                    coin.id,
                    CoinInstance.contractID,
                    'fetch',
                    [new Argument({name: 'coins', value: Buffer.from(valueBuf)})],
                ),
                Instruction.createSpawn(
                    this.id,
                    CoinInstance.contractID,
                    [
                        new Argument({name: 'coinName', value: SPAWNER_COIN}),
                        new Argument({name: 'coinID', value: coinID}),
                        new Argument({name: 'darcID', value: darcID}),
                    ],
                ),
            ],
        });
        await ctx.updateCountersAndSign(this.rpc, [signers, []]);
        await this.rpc.sendTransactionAndWait(ctx);

        return CoinInstance.fromByzcoin(this.rpc, CoinInstance.coinIID(coinID));
    }

    /**
     * Create a credential instance for the given darc
     *
     * @param coin      The coin instance to take coins from
     * @param signers   The signers for the transaction
     * @param darcID    The darc instance ID
     * @param credID    The instance-ID for this credential - will be calculated as sha256("credential" | credID)
     * @param cred      The starting credentials
     * @returns a promise that resolves with the new credential instance
     */
    async spawnCredential(
        coin: CoinInstance,
        signers: Signer[],
        darcID: Buffer,
        credID: Buffer,
        cred: CredentialStruct,
    ): Promise<CredentialInstance> {
        try {
            const c = await CredentialInstance.fromByzcoin(this.rpc, CredentialInstance.credentialIID(credID));
            Log.warn('this credential is already registerd');
            return c;
        } catch (e) {
            // credential doesn't exist
        }

        Log.print('spawning credential at', credID, CredentialInstance.credentialIID(credID));
        const valueBuf = this.struct.costCredential.value.toBytesLE();
        const ctx = new ClientTransaction({
            instructions: [
                Instruction.createInvoke(
                    coin.id,
                    CoinInstance.contractID,
                    'fetch',
                    [new Argument({name: 'coins', value: Buffer.from(valueBuf)})],
                ),
                Instruction.createSpawn(
                    this.id,
                    CredentialInstance.contractID,
                    [
                        new Argument({name: 'darcID', value: darcID}),
                        new Argument({name: 'credID', value: credID}),
                        new Argument({name: 'credential', value: cred.toBytes()}),
                    ],
                ),
            ],
        });
        await ctx.updateCountersAndSign(this.rpc, [signers, []]);

        await this.rpc.sendTransactionAndWait(ctx);

        return CredentialInstance.fromByzcoin(this.rpc, CredentialInstance.credentialIID(credID));
    }

    /**
     * Create a PoP party
     *
     * @param coin The coin instance to take coins from
     * @param signers The signers for the transaction
     * @param orgs The list fo organisers
     * @param descr The data for the PoP party
     * @param reward The reward of an attendee
     * @returns a promise tha resolves with the new pop party instance
     */
    async spawnPopParty(params: ICreatePopParty): Promise<PopPartyInstance> {
        const {coin, signers, orgs, desc, reward} = params;

        // Verify that all organizers have published their personhood public key
        for (const org of orgs) {
            if (!org.getAttribute('personhood', 'ed25519')) {
                throw new Error(`One of the organisers didn't publish his personhood key`);
            }
        }

        const orgDarcIDs = orgs.map((org) => org.darcID);
        const valueBuf = this.struct.costDarc.value.add(this.struct.costParty.value).toBytesLE();
        const orgDarc = PopPartyInstance.preparePartyDarc(orgDarcIDs, 'party-darc ' + desc.name);
        const ctx = new ClientTransaction({
            instructions: [
                Instruction.createInvoke(
                    coin.id,
                    CoinInstance.contractID,
                    'fetch',
                    [new Argument({name: 'coins', value: Buffer.from(valueBuf)})],
                ),
                Instruction.createSpawn(
                    this.id,
                    DarcInstance.contractID,
                    [new Argument({name: 'darc', value: orgDarc.toBytes()})],
                ),
                Instruction.createSpawn(
                    this.id,
                    PopPartyInstance.contractID,
                    [
                        new Argument({name: 'darcID', value: orgDarc.getBaseID()}),
                        new Argument({name: 'description', value: desc.toBytes()}),
                        new Argument({name: 'miningReward', value: Buffer.from(reward.toBytesLE())}),
                    ],
                ),
            ],
        });
        await ctx.updateCountersAndSign(this.rpc, [signers, [], []]);

        await this.rpc.sendTransactionAndWait(ctx);

        return PopPartyInstance.fromByzcoin(this.rpc, ctx.instructions[2].deriveId());
    }

    /**
     * Create a Rock-Paper-Scisors game instance
     *
     * @param desc      The description of the game
     * @param coin      The coin instance to take coins from
     * @param signers   The list of signers
     * @param stake     The reward for the winner
     * @param choice    The choice of the first player
     * @param fillup    Data that will be hash with the choice
     * @returns a promise that resolves with the new instance
     */
    async spawnRoPaSci(params: ICreateRoPaSci): Promise<RoPaSciInstance> {
        const {desc, coin, signers, stake, choice, fillup} = params;

        if (fillup.length !== 31) {
            throw new Error('need exactly 31 bytes for fillUp');
        }

        const c = new Coin({name: coin.name, value: stake.add(this.struct.costRoPaSci.value)});
        if (coin.value.lessThan(c.value)) {
            throw new Error('account balance not high enough for that stake');
        }

        const fph = createHash('sha256');
        fph.update(Buffer.from([choice % 3]));
        fph.update(fillup);
        const rps = new RoPaSciStruct({
            description: desc,
            firstPlayer: -1,
            firstPlayerHash: fph.digest(),
            secondPlayer: -1,
            secondPlayerAccount: Buffer.alloc(32),
            stake: c,
        });

        const ctx = new ClientTransaction({
            instructions: [
                Instruction.createInvoke(
                    coin.id,
                    CoinInstance.contractID,
                    'fetch',
                    [new Argument({name: 'coins', value: Buffer.from(c.value.toBytesLE())})],
                ),
                Instruction.createSpawn(
                    this.id,
                    RoPaSciInstance.contractID,
                    [new Argument({name: 'struct', value: rps.toBytes()})],
                ),
            ],
        });
        await ctx.updateCountersAndSign(this.rpc, [signers, []]);

        await this.rpc.sendTransactionAndWait(ctx);

        const rpsi = await RoPaSciInstance.fromByzcoin(this.rpc, ctx.instructions[1].deriveId());
        rpsi.setChoice(choice, fillup);

        return rpsi;
    }

    async spawnCalypsoWrite(coin: CoinInstance, signers: Signer[], lts: CreateLTSReply, key: Buffer, ident: IIdentity): Promise<CalypsoWriteInstance> {

        if (coin.value.lessThan(this.struct.costDarc.value.add(this.struct.costCWrite.value))) {
            throw new Error('account balance not high enough for spawning a darc + calypso writer');
        }

        let d = await this.spawnDarc(coin, signers,
            Darc.newDarc([ident], [ident], Buffer.from('calypso write protection'), ['spawn:calypsoRead']));

        let write = await Write.createWrite(lts.instanceid, d[0].id, lts.X, key);
        write.cost = this.struct.costCRead;

        const ctx = new ClientTransaction({
            instructions: [
                Instruction.createInvoke(coin.id, CoinInstance.contractID, 'fetch', [
                    new Argument({name: 'coins', value: Buffer.from(this.struct.costCWrite.value.toBytesLE())})
                ]),
                Instruction.createSpawn(this.id, CalypsoWriteInstance.contractID, [
                    new Argument({name: 'write', value: Buffer.from(Write.encode(write).finish())}),
                    new Argument({name: 'darcID', value: d[0].id})
                ])
            ]
        });
        await ctx.updateCountersAndSign(this.rpc, [signers, []]);
        await this.rpc.sendTransactionAndWait(ctx);

        return CalypsoWriteInstance.fromByzcoin(this.rpc, ctx.instructions[1].deriveId());
    }
}

/**
 * Data of a spawner instance
 */
export class SpawnerStruct extends Message<SpawnerStruct> {
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('personhood.SpawnerStruct', SpawnerStruct, Coin);
    }

    readonly costDarc: Coin;
    readonly costCoin: Coin;
    readonly costCredential: Coin;
    readonly costParty: Coin;
    readonly costRoPaSci: Coin;
    readonly costCWrite: Coin;
    readonly costCRead: Coin;
    readonly beneficiary: InstanceID;

    constructor(props?: Properties<SpawnerStruct>) {
        super(props);

        /* Protobuf aliases */

        Object.defineProperty(this, 'costdarc', {
            get(): Coin {
                return this.costDarc;
            },
            set(value: Coin) {
                this.costDarc = value;
            },
        });

        Object.defineProperty(this, 'costcoin', {
            get(): Coin {
                return this.costCoin;
            },
            set(value: Coin) {
                this.costCoin = value;
            },
        });

        Object.defineProperty(this, 'costcredential', {
            get(): Coin {
                return this.costCredential;
            },
            set(value: Coin) {
                this.costCredential = value;
            },
        });

        Object.defineProperty(this, 'costparty', {
            get(): Coin {
                return this.costParty;
            },
            set(value: Coin) {
                this.costParty = value;
            },
        });

        Object.defineProperty(this, 'costropasci', {
            get(): Coin {
                return this.costRoPaSci;
            },
            set(value: Coin) {
                this.costRoPaSci = value;
            },
        });

        Object.defineProperty(this, 'costcread', {
            get(): Coin {
                return this.costCRead;
            },
            set(value: Coin) {
                this.costCRead = value;
            },
        });
        Object.defineProperty(this, 'costcwrite', {
            get(): Coin {
                return this.costCWrite;
            },
            set(value: Coin) {
                this.costCWrite = value;
            },
        });
    }
}

/**
 * Fields of the costs of a spawner instance
 */
interface ICreateCost {
    [k: string]: Long;

    costDarc: Long;
    costCoin: Long;
    costCredential: Long;
    costParty: Long;
}

/**
 * Parameters to create a spawner instance
 */
interface ICreateSpawner {
    [k: string]: any;

    bc: ByzCoinRPC;
    darcID: InstanceID;
    signers: Signer[];
    costs: ICreateCost;
    beneficiary: InstanceID;
}

/**
 * Parameters to create a rock-paper-scisors game
 */
interface ICreateRoPaSci {
    [k: string]: any;

    desc: string;
    coin: CoinInstance;
    signers: Signer[];
    stake: Long;
    choice: number;
    fillup: Buffer;
}

/**
 * Parameters to create a pop party
 */
interface ICreatePopParty {
    [k: string]: any;

    coin: CoinInstance;
    signers: Signer[];
    orgs: CredentialInstance[];
    desc: PopDesc;
    reward: Long;
}

/**
 * Parameters to create a rock-paper-scisors game
 */
interface ISpawnCalyspoWrite {
    [k: string]: any;

    coin: CoinInstance;
    signers: Signer[];
    write: Write;
    darcID: InstanceID;
    choice: number;
}


SpawnerStruct.register();
