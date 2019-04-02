import {Point, PointFactory, Scalar, sign} from "@dedis/kyber";
import Signer from "../../../darc/signer";
import Log from "../../../log";
import ByzCoinRPC from "../../byzcoin-rpc";
import ClientTransaction, {Argument, Instruction} from "../../client-transaction";
import Instance from "../../instance";
import CredentialInstance from "../credentials-instance";
import DarcInstance from "../darc-instance";
import SpawnerInstance from "../spawner-instance";
import {FinalStatement, PopPartyStruct} from "./proto";
import Darc from "../../../darc/darc";

const {anon} = sign;

export class PopPartyInstance extends Instance{
    static readonly contractID = "popParty";
    static readonly PRE_BARRIER = 1;
    static readonly SCANNING = 2;
    static readonly FINALIZED = 3;

    /**
     * Get a pop party from byzcoin
     *
     * @param bc    The RPC to use
     * @param iid   The instance ID of the party
     * @returns a promise that resolves with the party instance
     */
    static async fromByzcoin(bc: ByzCoinRPC, iid: Buffer): Promise<PopPartyInstance> {
        return new PopPartyInstance(bc, await Instance.fromByzCoin(bc, iid));
    }

    private rpc: ByzCoinRPC;
    private instance: Instance;
    private tmpAttendees: Point[] = [];
    public popPartyStruct: PopPartyStruct;

    constructor(public bc: ByzCoinRPC, inst: Instance) {
        super(inst);

        this.rpc = bc;
        this.instance = inst;
        this.popPartyStruct = PopPartyStruct.decode(this.instance.data);
    }

    /**
     * Getter for the final statement. It throws if the party
     * is not finalized.
     *
     * @returns the final statement
     */
    get finalStatement(): FinalStatement {
        if (this.popPartyStruct.state !== PopPartyInstance.FINALIZED) {
            throw new Error("this party is not finalized yet");
        }

        return new FinalStatement({
            attendees: this.popPartyStruct.attendees,
            desc: this.popPartyStruct.description,
        });
    }

    /**
     * Add an attendee to the party
     *
     * @param attendee The public key of the attendee
     */
    addAttendee(attendee: Point): void {
        if (this.popPartyStruct.state !== PopPartyInstance.SCANNING) {
            throw new Error("party is not in attendee-adding mode");
        }

        if (this.tmpAttendees.findIndex((pub) => pub.equals(attendee)) === -1) {
            this.tmpAttendees.push(attendee);
        }
    }

    /**
     * Remove an attendee from the party
     *
     * @param attendee The public key of the attendee
     */
    removeAttendee(attendee: Point): number {
        if (this.popPartyStruct.state !== PopPartyInstance.SCANNING) {
            throw new Error("party is not in attendee-adding mode");
        }

        const i = this.tmpAttendees.findIndex((pub) => pub.equals(attendee));
        if (i >= 0) {
            this.tmpAttendees.splice(i, 1);
        }

        return this.tmpAttendees.length;
    }

    /**
     * Start the party
     *
     * @param signers The list of signers for the transaction
     * @returns a promise that resolves with the state of the party
     */
    async activateBarrier(signers: Signer[]): Promise<number> {
        if (this.popPartyStruct.state !== PopPartyInstance.PRE_BARRIER) {
            throw new Error("barrier point has already been passed");
        }

        const instr = Instruction.createInvoke(
            this.instance.id,
            PopPartyInstance.contractID,
            "barrier",
            [],
        );

        const ctx = new ClientTransaction({instructions: [instr]});
        await ctx.updateCounters(this.rpc, signers);
        ctx.signWith([signers]);

        await this.bc.sendTransactionAndWait(ctx);
        await this.update();

        return this.popPartyStruct.state;
    }

    /**
     * Finalize the party
     *
     * @param signers The list of signers for the transaction
     * @returns a promise that resolves with the state of the party
     */
    async finalize(signers: Signer[]): Promise<number> {
        if (this.popPartyStruct.state !== PopPartyInstance.SCANNING) {
            throw new Error("party did not pass barrier-point yet");
        }

        this.popPartyStruct.updateAttendes(this.tmpAttendees);

        const instr = Instruction.createInvoke(
            this.instance.id,
            PopPartyInstance.contractID,
            "finalize",
            [new Argument({name: "attendees", value: this.popPartyStruct.attendees.toBytes()})],
        );

        const ctx = new ClientTransaction({instructions: [instr]});
        await ctx.updateCounters(this.rpc, signers);
        ctx.signWith([signers]);

        await this.bc.sendTransactionAndWait(ctx);
        await this.update();

        return this.popPartyStruct.state;
    }

    /**
     * Update the party data
     * @returns a promise that resolves with an updaed instance
     */
    async update(): Promise<PopPartyInstance> {
        this.instance = await Instance.fromByzCoin(this.rpc, this.instance.id);
        this.popPartyStruct = PopPartyStruct.decode(this.instance.data);

        if (this.popPartyStruct.state === PopPartyInstance.SCANNING &&
            this.tmpAttendees.length === 0) {
            this.tmpAttendees = await this.fetchOrgKeys();
        }

        return this;
    }

    /**
     * Mine coins for a person using either an existing coinIID, or a
     * new darc that yet has to be instantiated.
     *
     * @param secret The secret key of the miner
     * @param coinID The coin instance ID of the miner
     * @param newDarc A new darc that has not been instantiated yet
     */
    async mine(secret: Scalar, coinID?: Buffer, newDarc?: Darc): Promise<void> {
        if (this.popPartyStruct.state !== PopPartyInstance.FINALIZED) {
            throw new Error("cannot mine on a non-finalized party");
        }

        const keys = this.popPartyStruct.attendees.publics;
        const lrs = await anon.sign(Buffer.from("mine"), keys, secret, this.instance.id);
        const args = [
            new Argument({name: "lrs", value: lrs.encode()})
        ];
        if (coinID) {
            args.push(new Argument({name: "coinIID", value: coinID}))
        } else if (newDarc) {
            args.push(new Argument({name: "newDarc", value: newDarc.toBytes()}))
        } else {
            throw new Error("need to give either coinIID or newDarc");
        }

        const instr = Instruction.createInvoke(
            this.instance.id,
            PopPartyInstance.contractID,
            "mine",
            args,
        );

        // the transaction is not signed but there is a counter-measure against
        // replay attacks server-side
        const ctx = new ClientTransaction({instructions: [instr]});

        await this.bc.sendTransactionAndWait(ctx);
        await this.update();
    }

    async fetchOrgKeys(): Promise<Point[]> {
        const piDarc = await DarcInstance.fromByzcoin(this.bc, this.instance.darcID);
        const exprOrgs = piDarc.getDarc().rules.list.find((l) => l.action === "invoke:popParty.finalize").expr;
        const orgDarcs = exprOrgs.toString().split(" | ");
        const orgPers: Point[] = [];

        for (let orgDarc of orgDarcs) {
            // Remove leading "darc:" from expression
            orgDarc = orgDarc.substr(5);
            const orgCred = SpawnerInstance.credentialIID(Buffer.from(orgDarc, "hex"));
            const cred = await CredentialInstance.fromByzcoin(this.bc, orgCred);
            const credPers = cred.getAttribute("personhood", "ed25519");
            if (!credPers) {
                throw new Error("found organizer without personhood credential");
            }

            const pub = PointFactory.fromProto(credPers);
            orgPers.push(pub);
        }

        return orgPers;
    }
}
