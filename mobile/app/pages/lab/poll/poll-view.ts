// tslint:disable-next-line
require("nativescript-nodeify");

import { Badge, PollStruct } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import { Observable } from "tns-core-modules/data/observable";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { isAdmin, uData } from "~/lib/byzcoin-def";
import { msgFailed } from "~/lib/messages";
import { elPoll, updatePoll } from "~/pages/lab/poll/poll-page";

export class PollView extends Observable {
    polls = new ObservableArray();
    networkStatus: string;

    constructor() {
        super();
    }

    async updatePolls() {
        this.polls.splice(0);
        uData.polls.forEach((rps) => {
            this.polls.push(new PollViewElement(rps));
        });
        this.set("polls", this.polls);
    }

    setProgress(text: string = "", width: number = 0) {
        elPoll.set("networkStatus", width === 0 ? undefined : text);
        if (width !== 0) {
            let color = "#308080;";
            if (width < 0) {
                color = "#a04040";
            }
            const pb = topmost().getViewById("progress_bar");
            if (pb) {
                pb.setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
            }
        }
    }
}

export class PollViewElement extends Observable {
    choices = new ObservableArray();

    constructor(public poll: PollStruct) {
        super();
        poll.choices.forEach((_, c) => {
            this.choices.push(new PollChoiceElement(poll, c));
        });
        this.set("height", 30 * poll.choices.length);
    }

    async onTap(arg: GestureEventData) {
        const del = "Delete";
        const cancel = "Cancel";
        const choices = this.poll.choices.map((c) => "Send vote for " + c);
        if (isAdmin) {
            choices.push(del);
        }
        try {
            // tslint:disable:object-literal-sort-keys
            const action = await dialogs.action({
                message: "Chose action",
                cancelButtonText: cancel,
                actions: choices,
            });
            // tslint:enable:object-literal-sort-keys
            switch (action) {
                case del:
                    elPoll.setProgress(localize("polls.deleting"), 33);
                    await uData.phrpc.pollDelete(uData.keyIdentitySigner, this.poll.pollID);
                    elPoll.setProgress(localize("polls.updating"), 66);
                    await elPoll.updatePolls();
                    elPoll.setProgress(localize("progress.done"), 100);
                    break;
                case cancel:
                    break;
                default:
                    const index = choices.findIndex((c) => c === action);
                    let badge: Badge;
                    if (this.poll.personhood.equals(Buffer.alloc(32))) {
                        badge = uData.badges[0];
                    } else {
                        badge = uData.badges.find((p) => {
                            return p.party.partyInstance.id.equals(this.poll.personhood);
                        });
                    }
                    if (badge == null) {
                        await msgFailed("Invalid poll with invalid partyID");
                        return;
                    }
                    await uData.phrpc.pollAnswer(uData.keyPersonhood._private.scalar, badge.party.partyInstance,
                        this.poll.pollID, index);
            }
        } catch (e) {
            await msgFailed(e.toString(), "Error");
        }
        elPoll.setProgress();
        await updatePoll();
        elPoll.setProgress();
    }
}

export class PollChoiceElement extends Observable {
    constructor(poll: PollStruct, index: number) {
        super();
        const max = poll.choices.reduce((prev: number, _, curr: number) => {
            return Math.max(prev, poll.choiceCount(curr));
        }, 1);
        this.set("label", poll.choices[index]);
        const chosen = poll.chosen.filter((c) => c.choice === index).length;
        this.set("counts", poll.choiceCount(index));
        this.set("bar", Math.round(chosen * 100. / max).toString() + "%");
    }
}
