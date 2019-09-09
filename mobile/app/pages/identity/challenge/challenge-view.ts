import { Observable } from "tns-core-modules/data/observable";
import { topmost } from "tns-core-modules/ui/frame";
import { Data } from "~/lib/dynacred/Data";
import { uData } from "~/lib/user-data";

export class ChallengeViewModel extends Observable {
    participants: Participant[];

    constructor(d: Data) {
        super();
    }

    async updateList() {
        this.participants = [new Participant("test", 99)];
        this.participants = [new Participant("test2", 97)];
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
    constructor(public alias: string, public score: number) {
    }
}
