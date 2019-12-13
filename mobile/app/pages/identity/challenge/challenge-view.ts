// tslint:disable-next-line
require("nativescript-nodeify");

import { Contact } from "@c4dt/dynacred";
import { ChallengeCandidate, Data } from "@c4dt/dynacred";
import { InstanceID } from "@dedis/cothority/byzcoin";
import Log from "@dedis/cothority/log";
import Long from "long";
import { localize } from "nativescript-localize";
import { Observable } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { isAdmin, uData } from "~/lib/byzcoin-def";
import { getRawData, rawToPercent } from "~/lib/personhood";

export class ChallengeViewModel extends Observable {
    static candidates: Map<string, string> = new Map<string, string>();
    participants: Participant[];
    isAdmin = isAdmin;

    constructor(d: Data) {
        super();
    }

    async updateList() {
        try {
            this.setProgress(localize("challenge.updating"), 30);
            const challengers = await uData.phrpc.challenge(new ChallengeCandidate({
                credential: uData.contact.credentialIID,
                score: Object.values(rawToPercent(getRawData(uData))).reduce((a, b) => a + b) * 2,
                signup: uData.contact.joinedChallenge,
            }));
            this.setProgress(localize("challenge.searching"), 60);
            await this.updateCandidates(challengers.map((challenger) => challenger.credential));
            this.participants = challengers.map((challenger) =>
                new Participant(ChallengeViewModel.candidates.get(challenger.credential.toString("hex")),
                    challenger));
            this.setProgress(localize("progress.done"), 100);
            this.participants = this.participants.filter((participant) => participant.isVisible());
            this.notifyPropertyChange("participants", this.participants);
        } catch (e) {
            Log.catch(e);
        }
        this.setProgress();
    }

    async updateCandidates(creds: InstanceID[]) {
        const unknown = creds.filter((cred) =>
            !ChallengeViewModel.candidates.has(cred.toString("hex")));
        if (unknown.length > 0) {
            const contacts = await Promise.all(unknown.map(async (iid) => {
                try {
                    const c = await Contact.fromByzcoin(uData.bc, iid);
                    return c;
                } catch (e) {
                    Log.warn("couldn't load contact:", e.toString());
                    return null as Contact;
                }
            }));
            contacts.filter((c) => c).forEach((contact) => {
                ChallengeViewModel.candidates.set(contact.credentialIID.toString("hex"), contact.alias);
            });
        }
    }

    setProgress(text: string = "", width: number = 0) {
        if (width === 0) {
            this.set("networkStatus", null);
        } else {
            let color = "#308080;";
            if (width < 0) {
                color = "#a04040";
            }
            const pb = topmost().getViewById("progress_bar");
            if (pb) {
                pb.setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
            }
            this.set("networkStatus", text);
        }
    }
}

export class Participant {
    score: number;
    iid: InstanceID;
    signup: Long;

    constructor(public alias: string, ch: ChallengeCandidate) {
        this.score = ch.score / 2;
        this.iid = ch.credential;
        this.signup = ch.signup;
    }

    async showParticipant() {
        topmost().navigate({
            context: await Contact.fromByzcoin(uData.bc, this.iid, false),
            moduleName: "pages/identity/contacts/actions/actions-page",
        });
    }

    isVisible() {
        // Show user for 12h in challenge.
        return this.signup.greaterThan(Long.fromNumber(Date.now() - 86400 * 1000 / 2));
    }
}
