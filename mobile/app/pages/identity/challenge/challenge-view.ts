import { Observable } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { InstanceID } from "~/lib/cothority/byzcoin";
import Log from "~/lib/cothority/log";
import { Contact } from "~/lib/dynacred";
import { Data } from "~/lib/dynacred/Data";
import { ChallengeCandidate } from "~/lib/dynacred/personhood-rpc";
import { getRawData, rawToPercent } from "~/lib/personhood";
import { uData } from "~/lib/user-data";

export class ChallengeViewModel extends Observable {
    static candidates: Map<string, string> = new Map<string, string>();
    participants: Participant[];

    constructor(d: Data) {
        super();
    }

    async updateList() {
        try {
            this.setProgress("Updating list", 30);
            const challengers = await uData.phrpc.challenge(new ChallengeCandidate({
                credential: uData.contact.credentialIID,
                score: Object.values(rawToPercent(getRawData(uData))).reduce((a, b) => a + b) * 2,
            }));
            this.setProgress("Searching new candidates", 60);
            await this.updateCandidates(challengers.map((challenger) => challenger.credential));
            this.participants = challengers.map((challenger) =>
                new Participant(ChallengeViewModel.candidates.get(challenger.credential.toString("hex")),
                    challenger.score / 2, challenger.credential));
            this.setProgress("Done", 100);
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
    constructor(public alias: string, public score: number, public iid: InstanceID) {
    }

    async showParticipant() {
        topmost().navigate({
            context: await Contact.fromByzcoin(uData.bc, this.iid, false),
            moduleName: "pages/identity/contacts/actions/actions-page",
        });
    }
}
