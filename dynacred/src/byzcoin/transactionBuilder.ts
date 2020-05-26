import { Argument, ByzCoinRPC, ClientTransaction, Instruction } from "@dedis/cothority/byzcoin";
import { AddTxResponse } from "@dedis/cothority/byzcoin/proto/requests";
import ISigner from "@dedis/cothority/darc/signer";

/**
 * TransactionBuilder handles collecting multiple instructions and signing them all
 * together before sending the transaction to the chain.
 * There are convenience methods to create spawn, invoke, or delete instructions.
 * Once all instructions are added, the send method will contact one or more nodes
 * to submit the transaction.
 * After a call to the send method, the transaction is ready for new instructions.
 */
export class TransactionBuilder {
    private instructions: Instruction[] = [];

    constructor(protected bc: ByzCoinRPC) {
    }

    async send(signers: ISigner[][], wait = 0): Promise<[ClientTransaction, AddTxResponse]> {
        const ctx = ClientTransaction.make(this.bc.getProtocolVersion(), ...this.instructions);
        await ctx.updateCountersAndSign(this.bc, signers);
        const response = await this.bc.sendTransactionAndWait(ctx, wait);
        this.instructions = [];
        return [ctx, response];
    }

    append(inst: Instruction): Instruction {
        this.instructions.push(inst);
        return inst;
    }

    prepend(inst: Instruction): Instruction {
        this.instructions.unshift(inst);
        return inst;
    }

    spawn(iid: Buffer, contractID: string, args: Argument[]): Instruction {
        return this.append(Instruction.createSpawn(iid, contractID, args));
    }

    invoke(iid: Buffer, contractID: string, command: string, args: Argument[]): Instruction {
        return this.append(Instruction.createInvoke(iid, contractID, command, args));
    }

    delete(iid: Buffer, contractID: string): Instruction {
        return this.append(Instruction.createDelete(iid, contractID));
    }

    toString(): string {
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
