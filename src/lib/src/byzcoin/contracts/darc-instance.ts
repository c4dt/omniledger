import Darc from '../../darc/darc';
import Signer from '../../darc/signer';
import ByzCoinRPC from '../byzcoin-rpc';
import ClientTransaction, {Argument, Instruction} from '../client-transaction';
import Instance, {InstanceID} from '../instance';
import {Log} from '../../log';

export default class DarcInstance extends Instance {

    static readonly contractID = 'darc';
    public darc: Darc;

    constructor(private rpc: ByzCoinRPC, inst: Instance) {
        super(inst);
        if (inst.contractID.toString() !== DarcInstance.contractID) {
            throw new Error(`mismatch contract name: ${inst.contractID} vs ${DarcInstance.contractID}`);
        }

        this.darc = Darc.decode(inst.data);
    }

    /**
     * Initializes using an existing coinInstance from ByzCoin
     * @param bc a working ByzCoin instance
     * @param iid the instance id of the darc-instance
     */
    static async fromByzcoin(bc: ByzCoinRPC, iid: Buffer): Promise<DarcInstance> {
        return new DarcInstance(bc, await Instance.fromByzCoin(bc, iid));
    }

    /**
     * Update the data of this instance
     *
     * @return a promise that resolves once the data is up-to-date
     */
    async update(): Promise<DarcInstance> {
        const proof = await this.rpc.getProof(this.darc.getBaseID());
        const inst = await proof.getVerifiedInstance(this.rpc.getGenesis().computeHash(), DarcInstance.contractID);
        this.darc = Darc.decode(inst.data);

        return this;
    }

    getSignerExpression(): Buffer {
        for (const rule of this.darc.rules.list) {
            if (rule.action === '_sign') {
                return rule.expr;
            }
        }
        throw new Error('This darc doesn\'t have a sign expression');
    }

    getSignerDarcIDs(): InstanceID[] {
        const expr = this.getSignerExpression().toString();
        if (expr.match(/\(&/)) {
            throw new Error('Don\'t know what to do with "(" or "&" in expression');
        }
        const ret: InstanceID[] = [];
        expr.split('|').forEach(exp => {
            if (exp.startsWith('darc:')) {
                ret.push(Buffer.from(exp.slice(5), 'hex'));
            } else {
                Log.warn('Non-darc expression in signer:', exp);
            }
        });
        return ret;
    }

    /**
     * Request to evolve the existing darc using the new darc and wait for
     * the block inclusion
     *
     * @param newDarc The new darc
     * @param signers Signers for the counters
     * @param wait Number of blocks to wait for
     * @returns a promise that resolves with the new darc instance
     */
    async evolveDarcAndWait(newDarc: Darc, signers: Signer[], wait: number): Promise<DarcInstance> {
        if (!newDarc.getBaseID().equals(this.darc.getBaseID())) {
            throw new Error('not the same base id for the darc');
        }
        if (newDarc.version.compare(this.darc.version.add(1)) !== 0) {
            throw new Error('not the right version');
        }
        if (!newDarc.prevID.equals(this.darc.id)) {
            throw new Error('doesn\'t point to the previous darc');
        }
        const args = [new Argument({name: 'darc', value: Buffer.from(Darc.encode(newDarc).finish())})];
        const instr = Instruction.createInvoke(this.darc.getBaseID(), DarcInstance.contractID, 'evolve', args);

        const ctx = new ClientTransaction({instructions: [instr]});
        await ctx.updateCounters(this.rpc, [signers]);
        ctx.signWith([signers]);

        await this.rpc.sendTransactionAndWait(ctx, wait);

        return this.update();
    }

    /**
     * Request to spawn an instance and wait for the inclusion
     *
     * @param d             The darc to spawn
     * @param signers       Signers for the counters
     * @param wait          Number of blocks to wait for
     * @returns a promise that resolves with the new darc instance
     */
    async spawnDarcAndWait(d: Darc, signers: Signer[], wait: number = 0): Promise<DarcInstance> {
        await this.spawnInstanceAndWait(DarcInstance.contractID,
            [new Argument({
                name: 'darc',
                value: Buffer.from(Darc.encode(d).finish()),
            })], signers, wait);
        return DarcInstance.fromByzcoin(this.rpc, d.getBaseID());
    }

    /**
     * Request to spawn an instance of any contract and wait
     *
     * @param contractID    Contract name of the new instance
     * @param signers       Signers for the counters
     * @param wait          Number of blocks to wait for
     * @returns a promise that resolves with the instanceID of the new instance, which is only valid if the
     *          contract.spawn uses DeriveID.
     */
    async spawnInstanceAndWait(contractID: string, args: Argument[], signers: Signer[], wait: number = 0): Promise<InstanceID> {
        const instr = Instruction.createSpawn(this.darc.getBaseID(), DarcInstance.contractID, args);

        const ctx = new ClientTransaction({instructions: [instr]});
        await ctx.updateCounters(this.rpc, [signers]);
        ctx.signWith([signers]);

        await this.rpc.sendTransactionAndWait(ctx, wait);

        return ctx.instructions[0].deriveId();
    }
}
