import crypto from "crypto-browserify";
import Long from "long";
import { promisify } from "util";

import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";

import { TProgress } from "@c4dt/dynacred";
import { Argument, ClientTransaction, InstanceID, Instruction } from "@dedis/cothority/byzcoin";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import { Darc, IdentityWrapper } from "@dedis/cothority/darc";

import { showTransactions } from "../../../../../lib/Ui";
import { UserData } from "../../../../user-data.service";

enum StateT {
    LOADING,
    NO_ACCESS_WITH_CHECKAUTH,
    ASKING_IF_LOGIN,
    NO_ACCESS_WITH_TRANSACTION,
    REDIRECTING,
}

class Action {
    constructor(
        readonly darc: InstanceID,
        readonly coin: InstanceID,
    ) {
    }
}

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
    // TODO eww, better use Config (as a service maybe?)
    private static readonly serviceToDarcAndCoin: Map<string, Action> = (() => {
        const tr = (raw: string) => Buffer.from(raw, "hex");
        return new Map([
            ["www.c4dt.org", new Action(
                tr("5f125a9a2b1ceeab9d2320cfb97939d7cb652d77c56893bd9b6e3ecd5c25d7e8"),
                tr("aa595fca11710bec9b36a6908f9d5db019c21c065e1de22e111c194f0bd712fa"),
            )], ["c4dt.paperboy.ch", new Action(
                tr("5f125a9a2b1ceeab9d2320cfb97939d7cb652d77c56893bd9b6e3ecd5c25d7e8"),
                tr("aa595fca11710bec9b36a6908f9d5db019c21c065e1de22e111c194f0bd712fa"),
            )], ["matrix.c4dt.org", new Action(
                tr("ff85d61d63d83b61beee6115a8c0553946c060538f1af7a6d8a6b242dc774327"),
                tr("90b03f42b85540981f71a5e52f18e1df94a6ae68cd34ced132282a6219c2ad3d"),
            )]]);
    })();
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
    state: StateT;
    readonly service: string;
    readonly StateT = StateT;
    private readonly redirect: URL;
    private readonly action: Action;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dialog: MatDialog,
        private uData: UserData,
    ) {
        this.state = StateT.LOADING;

        const encodedRedirect = this.route.snapshot.queryParamMap.get("service");
        if (encodedRedirect === null) {
            throw new Error("missing 'service' param");
        }

        this.redirect = new URL(decodeURI(encodedRedirect));
        this.service = this.redirect.host;

        this.action = LoginComponent.serviceToDarcAndCoin.get(this.service);
        if (this.action === undefined) {
            throw new Error("no such service found");
        }
    }

    async ngOnInit() {
        const availables = await this.uData.bc.checkAuthorization(
            this.uData.bc.genesisID, this.action.darc,
            IdentityWrapper.fromIdentity(this.uData.keyIdentitySigner));
        const isAuthorized = availables.indexOf(Darc.ruleSign) !== -1;

        this.state = isAuthorized ?
            StateT.ASKING_IF_LOGIN : StateT.NO_ACCESS_WITH_CHECKAUTH;
    }

    private async login() {
        const challenge = new Buffer(LoginComponent.challengeSize);
        await promisify(crypto.randomFill)(challenge);

        const success = await showTransactions(
            this.dialog, "Generating login proof",
            async (progress: TProgress) => {
                progress(50, "Creating login token");
                return this.putChallenge(challenge);
            });

        if (!success) {
            this.state = StateT.NO_ACCESS_WITH_TRANSACTION;
            return;
        }
        this.state = StateT.REDIRECTING;

        const userCredID = this.uData.contact.credentialIID;
        const ticket = Buffer.concat([challenge, userCredID]);

        const nextLocation = this.redirect;
        nextLocation.searchParams.append("ticket",
            `ST-${LoginComponent.ticketEncoder(ticket)}`);

        window.location.replace(nextLocation.href);
    }

    private async deny() {
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
    private async putChallenge(challenge: Buffer): Promise<boolean> {
        const challengeHashed = LoginComponent.challengeHasher(challenge);
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
            createInvoke(userCoinID, transfer(this.action.coin)),
            createInvoke(this.action.coin, transfer(userCoinID).concat([
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
