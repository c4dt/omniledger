import { localize } from "nativescript-localize";
import { sprintf } from "sprintf-js";
import { Observable } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { ImageSource } from "tns-core-modules/image-source";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import Log from "~/lib/cothority/log";
import RoPaSciInstance, { RoPaSciStruct } from "~/lib/cothority/personhood/ro-pa-sci-instance";
import { msgFailed, msgOK } from "~/lib/messages";
import { isAdmin, uData } from "~/lib/user-data";
import { elRoPaSci, setProgress, updateRoPaSci } from "~/pages/lab/ropasci/ropasci-page";

export class RopasciView extends Observable {
    ropascis = new ObservableArray();
    networkStatus: string;
    isAdmin = isAdmin;

    constructor() {
        super();
    }

    async updateRoPaScis() {
        this.ropascis.splice(0);
        const rpsTmp: RopasciViewElement[] = [];
        uData.ropascis.map((r) => r).reverse().forEach((rps, index) => {
            // Decide if this ropasci needs to be displayed:
            if (rps.ourGame(uData.coinInstance.id) || // it's our game
                rps.struct.secondPlayer < 0 || // the second player has not played yet
                rps.struct.secondPlayerAccount.equals(uData.coinInstance.id)) {  // we are the 2nd player
                rpsTmp.push(new RopasciViewElement(rps, index));
            }
        });
        rpsTmp.sort((a, b) => a.order() - b.order());
        this.ropascis.push(...rpsTmp);
        elRoPaSci.notifyPropertyChange("ropascis", this.ropascis);
        this.ropascis.forEach((rps: RopasciViewElement) => {
            rps.updateColor();
        });
    }
}

export class RopasciViewElement extends Observable {

    get style(): string {
        let color = "00caab";
        if (this.step === 2) {
            switch (this.result) {
                case 0:
                    color = "eeeecc";
                    break;
                case 1:
                    color = this.ourGame ? "cceecc" : "eecccc";
                    break;
                case 2:
                    color = this.ourGame ? "eecccc" : "cceecc";
                    break;
            }
        }
        return "horizontal-align:left; opacity:0.5; background-color: #" + color;
    }

    get stake(): string {
        return this.rps.stake.value.toString();
    }

    get firstMove(): string {
        if (this.ourGame) {
            return "you: " + RopasciViewElement.moveToFAS(this.ropasci.getChoice()[0]);
        }
        if (this.rps.firstPlayer < 0) {
            return "other: ?";
        }
        return "other: " + RopasciViewElement.moveToFAS(this.rps.firstPlayer);
    }

    get secondMove(): string {
        if (this.step < 2) {
            if (this.ourGame) {
                return "wait";
            } else {
                return "join";
            }
        }
        return (this.ourGame ? "other: " : "you: ") + RopasciViewElement.moveToFAS(this.rps.secondPlayer);
    }

    get icon(): ImageSource {
        return null;
    }

    get bgcolor(): string {
        return 1 ? "party-participate" : "party-available";
    }

    get nextStep(): string {
        if (this.step === 2 &&
            this.result === 0) {
            return "Draw";
        }
        if (this.ourGame) {
            switch (this.step) {
                case 0:
                    return "Waiting for 2nd player";
                case 1:
                    return "Click to reveal";
                case 2:
                    return this.result === 1 ? "You won" : "You lost";
            }
        } else {
            switch (this.step) {
                case 0:
                    return "Click to join game";
                case 1:
                    return "Waiting for Reveal";
                case 2:
                    return this.result === 2 ? "You won" : "You lost";
            }
        }
    }

    get stepWidth(): string {
        return sprintf("%d%%", ((this.step + 1) * 33 + 1));
    }

    get ourGame(): boolean {
        return this.ropasci.ourGame(uData.coinInstance.id);
    }

    /**
     * Get the current step of the game:
     * - 0: waiting for second player
     * - 1: waiting for first player to reveal
     * - 2: game finished
     */
    get step(): number {
        if (this.rps.secondPlayer < 0) {
            return 0;
        }
        if (this.rps.firstPlayer < 0) {
            return 1;
        }
        return 2;
    }

    /**
     * Returns the result of the game:
     * - -1: game not finished yet
     * - 0: draw game
     * - 1: player 1 won
     * - 2: player 2 won
     */
    get result(): number {
        if (this.step !== 2) {
            return -1;
        }
        return (this.rps.firstPlayer + 3 - this.rps.secondPlayer) % 3;
    }

    static moveToFAS(move: number): string {
        switch (move) {
            case 0:
                return "\uf255";
                break;
            case 1:
                return "\uf256";
                break;
            case 2:
                return "\uf257";
                break;
            default:
                return "invalid";
        }
    }

    rps: RoPaSciStruct;

    constructor(public ropasci: RoPaSciInstance, public index: number) {
        super();
        this.rps = ropasci.struct;
        this.set("description", this.rps.description);
    }

    updateColor() {
        // let pb = topmost().getViewById("progress_bar_" + this.index);
        // if (pb) {
        //     pb.setInlineStyle(this.style);
        // }
        this.notifyPropertyChange("style", this.style);
    }

    order(): number {
        const id = this.ropasci.id.readUInt16BE(0) / 65536;
        switch (this.step) {
            case 0:
                return (this.ourGame ? 2 : 1) + id;
            case 1:
                return id;
            case 2:
                return 3 + id;
        }
    }

    async onTap(arg: GestureEventData) {
        const del = "Delete";
        const reveal = "Reveal choice";
        const cancel = "Cancel";
        const playRock = "Play Rock";
        const playPaper = "Play Paper";
        const playScissors = "Play Scissors";
        let choices = [del];
        switch (this.step) {
            case 0:
                if (!this.ourGame) {
                    try {
                        await uData.phrpc.lockRPS(this.ropasci.id);
                        choices = choices.concat([playRock, playPaper, playScissors]);
                    } catch (e) {
                        Log.warn("This ropasci is already locked:", e);
                        await msgOK("Couldn't play on this rock-paper-scissors, another player already chose it.",
                            "Couldn't play");
                        await updateRoPaSci();
                    }
                }
                break;
            case 1:
                if (this.ourGame) {
                    choices.unshift(reveal);
                }
                break;
        }
        let second = false;
        try {
            // tslint:disable:object-literal-sort-keys
            switch (await dialogs.action({
                message: "Chose action",
                cancelButtonText: cancel,
                actions: choices,
                // tslint:enable:object-literal-sort-keys
            })) {
                case del:
                    await uData.delRoPaSci(this.ropasci);
                    break;
                case playRock:
                    second = true;
                    setProgress(localize("ropascis.sending_move"), 50);
                    await this.ropasci.second(uData.coinInstance, uData.keyIdentitySigner, 0, uData.lts);
                    break;
                case playPaper:
                    second = true;
                    setProgress(localize("ropascis.sending_move"), 50);
                    await this.ropasci.second(uData.coinInstance, uData.keyIdentitySigner, 1, uData.lts);
                    break;
                case playScissors:
                    second = true;
                    setProgress(localize("ropascis.sending_move"), 50);
                    await this.ropasci.second(uData.coinInstance, uData.keyIdentitySigner, 2, uData.lts);
                    break;
                case reveal:
                    setProgress(localize("ropascis.revealing"), 50);
                    await this.ropasci.confirm(uData.coinInstance);
                    break;
                case cancel:
                    break;
            }
        } catch (e) {
            Log.catch(e);
            if (second) {
                await msgFailed("Somebody else joined the game before you.", "Missed your chance");
            } else {
                await msgFailed(e.toString(), "Error");
            }
        }
        this.updateColor();
        await updateRoPaSci();
        setProgress();
    }
}
