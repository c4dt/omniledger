import assert from "assert";
import crypto from "crypto";
import Long from "long";
import { promisify } from "util";

import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";

import { Argument, ClientTransaction, InstanceID, Instruction, Proof } from "@c4dt/cothority/byzcoin";
import CoinInstance from "@c4dt/cothority/byzcoin/contracts/coin-instance";

import { showTransactions } from "../../../../../lib/Ui";
import { UserData } from "../../../../user-data.service";

enum State {
    LOADING,
    FAILURE,
    SUCCESS,
}

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {

    // TODO eww, better use Config (as a service maybe?)
    private static readonly coinInstanceIDForService: Map<string, InstanceID> = new Map([
        ["c4dt.org", "aa595fca11710bec9b36a6908f9d5db019c21c065e1de22e111c194f0bd712fa"],
        ["c4dt.paperboy.ch", "aa595fca11710bec9b36a6908f9d5db019c21c065e1de22e111c194f0bd712fa"],
        ["matrix.c4dt.org", "90b03f42b85540981f71a5e52f18e1df94a6ae68cd34ced132282a6219c2ad3d"],
    ].map((l) => [l[0], Buffer.from(l[1], "hex")]));
    private static readonly coinCost = 1;
    private static readonly challengeSize = 20;
    private static readonly txArgName = "challenge";
    private static readonly challengeHasher = (val) => {
        const hash = crypto.createHash("sha256");
        hash.update(val);
        return hash.digest();
    }
    private static readonly ticketEncoder = (buf: Buffer) =>
        buf.toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")

    state: State;
    readonly service: string;

    private ticket: Buffer | undefined;
    private readonly redirect: URL;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dialog: MatDialog,
        private uData: UserData,
    ) {
        const encodedRedirect = this.route.snapshot.queryParamMap.get("service");
        if (encodedRedirect === null) {
            throw Error("missing 'service' param");
        }

        this.redirect = new URL(decodeURI(encodedRedirect));
        this.service = this.redirect.host;
        this.state = State.LOADING;
    }

    async ngOnInit() {
        const challenge = new Buffer(LoginComponent.challengeSize);
        await promisify(crypto.randomFill)(challenge);

        const success = await showTransactions(
            this.dialog, "Generating login proof",
            () => this.putChallenge(challenge));

        if (!success) {
            this.state = State.FAILURE;
            return;
        }

        const userCredID = this.uData.contact.credentialIID;
        this.ticket = Buffer.concat([challenge, userCredID]);
        this.state = State.SUCCESS;
    }

    async login() {
        assert.ok(this.ticket !== undefined, "asked to login without ticket");

        const nextLocation = this.redirect;
        nextLocation.searchParams.append("ticket",
            `ST-${LoginComponent.ticketEncoder(this.ticket)}`);

        window.location.replace(nextLocation.href);
    }

    async deny() {
        await this.router.navigate(["/"]);
    }

    /**
     * Try to put the challenge on the chain
     *
     * It's encoded as a coin exchange back and forth from the user to the Action's CoinInstance.
     * The Instruction getting it back contains an Argument with the hash of challenge, so that when the user provides
     * it, the transaction proves that he was the one generating it.
     *
     * @param   challenge to put on the chain
     * @return	success if we managed to put the challenge
     */
    private async putChallenge(challenge: Buffer): Promise<boolean> {
        const challengeHashed = LoginComponent.challengeHasher(challenge);
        const coinInstID = LoginComponent.coinInstanceIDForService.get(this.service);
        if (coinInstID === undefined) {
            throw Error("no such service found");
        }

        const coins = Buffer.from(new Long(LoginComponent.coinCost).toBytesLE());
        const createInvoke = (src: InstanceID, args: Argument[]) =>
            Instruction.createInvoke(
                src,
                CoinInstance.contractID,
                CoinInstance.commandTransfer, args);
        const transfer = (dst: InstanceID) => [
            new Argument({name: CoinInstance.argumentCoins, value: coins}),
            new Argument({name: CoinInstance.argumentDestination, value: dst})];

        const userCoinID = this.uData.coinInstance.id;
        const ctx = ClientTransaction.make(this.uData.bc.getProtocolVersion(),
            createInvoke(userCoinID, transfer(coinInstID)),
            createInvoke(coinInstID, transfer(userCoinID).concat([
                new Argument({name: LoginComponent.txArgName, value: challengeHashed})])));
        await ctx.updateCountersAndSign(this.uData.bc, [[this.uData.keyIdentitySigner]]);

        try {
            await this.uData.bc.sendTransactionAndWait(ctx);
        } catch (err) {
            if (err instanceof Error && err.message.includes(
                `Contract coin got Instruction ${ctx.instructions[1].hash().toString("hex")}` +
                " and returned error: instruction verification failed")) {
                return false;
            }
            throw err;
        }

        return true;
    }
}
