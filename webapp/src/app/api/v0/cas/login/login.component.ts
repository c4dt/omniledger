import crypto from "crypto-browserify";
import Long from "long";
import { promisify } from "util";

import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";

import { Argument, ClientTransaction, InstanceID, Instruction } from "@dedis/cothority/byzcoin";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import { Darc, IdentityWrapper } from "@dedis/cothority/darc";

import { Config, ConfigService } from "src/app/api/v0/cas/config.service";
import { ByzCoinService } from "src/app/byz-coin.service";
import { UserService } from "src/app/user.service";
import { showTransactions, TProgress } from "../../../../../lib/Ui";

enum StateT {
    LOADING,
    NO_ACCESS_WITH_CHECKAUTH,
    ASKING_IF_LOGIN,
    NO_ACCESS_WITH_TRANSACTION,
    REDIRECTING,
    NO_SUCH_SERVICE,
}

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
    state: StateT;
    readonly redirect: URL;
    readonly service: URL;
    readonly StateT = StateT;

    private readonly config: Promise<Config>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dialog: MatDialog,
        configService: ConfigService,
        private user: UserService,
        private builder: ByzCoinService,
    ) {
        this.state = StateT.LOADING;

        const encodedRedirect = this.route.snapshot.queryParamMap.get("service");
        if (encodedRedirect === null) {
            throw new Error("missing 'service' param");
        }

        this.config = configService.config;
        this.redirect = new URL(decodeURI(encodedRedirect));

        const service = new URL(this.redirect.href);
        service.hash = service.search = "";
        this.service = service;
    }

    async ngOnInit() {
        const action = (await this.config).serviceToAction.get(this.service.href);
        if (action === undefined) {
            this.state = StateT.NO_SUCH_SERVICE;
            throw new Error(`no such service found: ${this.service.href}`);
        }

        const availables = await this.builder.bc.checkAuthorization(
            this.builder.bc.genesisID, action.darc,
            IdentityWrapper.fromIdentity(this.user.kiSigner));
        const isAuthorized = availables.indexOf(Darc.ruleSign) !== -1;

        this.state = isAuthorized ?
            StateT.ASKING_IF_LOGIN : StateT.NO_ACCESS_WITH_CHECKAUTH;
    }

    async login() {
        const config = await this.config;

        const challenge = Buffer.alloc(config.challengeSize);
        await promisify(crypto.randomFill)(challenge);

        const success = await showTransactions(
            this.dialog, "Generating login proof",
            async (progress: TProgress) => {
                progress(50, "Creating login token");
                return this.putChallenge(config, challenge);
            });

        if (!success) {
            this.state = StateT.NO_ACCESS_WITH_TRANSACTION;
            return;
        }
        this.state = StateT.REDIRECTING;

        const userCredID = this.user.credStructBS.id;
        const ticket = Buffer.concat([challenge, userCredID]);

        const nextLocation = this.redirect;
        nextLocation.searchParams.append("ticket",
            `ST-${config.ticketEncoder(ticket)}`);

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
     * @param   challenge data to tag the transaction with
     * @return    success if we managed to put the challenge
     */
    private async putChallenge(config: Config, challenge: Buffer): Promise<boolean> {
        const action = (await this.config).serviceToAction.get(this.service.href);
        if (action === undefined) {
            this.state = StateT.NO_SUCH_SERVICE;
            throw new Error(`no such service found: ${this.service.href}`);
        }

        const challengeHashed = config.challengeHasher(challenge);
        const coins = Buffer.from(new Long(config.coinCost).toBytesLE());
        const createInvoke = (src: InstanceID, args: Argument[]) =>
            Instruction.createInvoke(
                src,
                CoinInstance.contractID,
                CoinInstance.commandTransfer, args);
        const transfer = (dst: InstanceID) => [
            new Argument({name: CoinInstance.argumentCoins, value: coins}),
            new Argument({name: CoinInstance.argumentDestination, value: dst})];

        const userCoinID = this.user.coinBS.getValue().id;
        const ctx = ClientTransaction.make(this.builder.bc.getProtocolVersion(),
            createInvoke(userCoinID, transfer(action.coin)),
            createInvoke(action.coin, transfer(userCoinID).concat([
                new Argument({name: config.txArgName, value: challengeHashed})])));
        await ctx.updateCountersAndSign(this.builder.bc, [[this.user.kiSigner]]);

        try {
            await this.builder.bc.sendTransactionAndWait(ctx);
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
