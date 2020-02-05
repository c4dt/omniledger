// tslint:disable-next-line
require("nativescript-nodeify");

import { TProgress } from "@c4dt/dynacred";
import Log from "@dedis/cothority/log";
import { topmost } from "tns-core-modules/ui/frame";
import { Observable, Page } from "tns-core-modules/ui/page";

let page: Page;
let mpGlobal: ModalProgress;

export function onShownModally(args) {
    if (!(args.context instanceof ModalProgress)) {
        throw new Error("need ModalProgress instance in context");
    }
    mpGlobal = args.context as ModalProgress;
    page = args.object as Page;
    page.bindingContext = mpGlobal;
    return mpGlobal.execute(args.closeCallback);
}

export type TWorker = (progress: TProgress) => Promise<void>;

export class ModalProgress extends Observable {
    static show(worker: TWorker): Promise<void> {
        return new Promise((resolve) => {
            const mp = new ModalProgress(worker);
            topmost().showModal("pages/modal/modal-progress", {
                closeCallback: () => {
                    resolve();
                },
                context: mp,
                fullscreen: true,
            });
        });
    }

    ccb: () => void;
    constructor(private worker: TWorker) {
        super();
    }

    setProgress(width: number = 0, text: string = "") {
        this.set("networkStatus", width === 0 ? undefined : text);
        if (width !== 0) {
            let color = "#308080;";
            if (width < 0) {
                color = "#a04040";
            }
            page.getViewById("progress_bar").setInlineStyle("width:" + Math.abs(width) +
                "%; background-color: " + color);
        }
    }

    async execute(ccb: () => void): Promise<void> {
        try {
            await this.worker((w: number, t: string) => {
                this.setProgress(w, t);
            });
            ccb();
        } catch (e) {
            Log.catch(e, "While executing worker");
            this.setProgress(-100, e.toString());
            this.ccb = ccb;
            this.set("error", true);
        }
    }
}

export function close() {
    mpGlobal.ccb();
}
