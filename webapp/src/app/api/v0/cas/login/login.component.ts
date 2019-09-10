import assert from "assert";
import crypto from "crypto";
import Long from "long";
import { promisify } from "util";

import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";

import { Argument, ClientTransaction, InstanceID, Instruction, Proof } from "@c4dt/cothority/byzcoin";
import CoinInstance from "@c4dt/cothority/byzcoin/contracts/coin-instance";

import { UserData } from "../../../../user-data.service";

enum State {
    LOADING,
    FAILURE,
    SUCCESS,
}

@Component({
    selector: "app-login",
    styleUrls: ["./login.component.css"],
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {

    // TODO eww, better use Config (as a service maybe?)
    private static readonly coinInstanceIDForService: Map<string, InstanceID> = new Map([
        ["localhost", "8c22411f1aaf3248542f6b677fd066db3178bc0a2b60adc2aaa9d6cc80938b0f"],
        // TODO use correct hex, ie CoinInstance's one
        ["c4dt.org", ""],
        ["matrix.c4dt.org", ""],
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

        if (! await this.putChallenge(challenge)) {
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
