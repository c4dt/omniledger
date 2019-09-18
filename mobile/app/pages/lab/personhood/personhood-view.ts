import { localize } from "nativescript-localize";
import { sprintf } from "sprintf-js";
import { Observable } from "tns-core-modules/data/observable";
import { Folder, knownFolders, path } from "tns-core-modules/file-system";
import { fromFile, ImageSource } from "tns-core-modules/image-source";
import * as dialogs from "tns-core-modules/ui/dialogs";
import { topmost } from "tns-core-modules/ui/frame";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { appRootMain } from "~/app-root";
import { IdentityWrapper } from "~/lib/cothority/darc";
import Log from "~/lib/cothority/log";
import { PopPartyInstance } from "~/lib/cothority/personhood/pop-party-instance";
import { PopDesc } from "~/lib/cothority/personhood/proto";
import { Badge } from "~/lib/dynacred/Badge";
import { PartyItem } from "~/lib/dynacred/PartyItem";
import { msgFailed, msgOK } from "~/lib/messages";
import { partyQrcode } from "~/lib/qrcode";
import { finishData, isAdmin, uData } from "~/lib/user-data";
import { elements } from "~/pages/lab/personhood/personhood-page";

export class PersonhoodView extends Observable {
    parties: PartyView[] = [];
    badges: BadgeView[] = [];
    canAddParty: boolean;

    constructor() {
        super();
        this.updateBadges();
    }

    get elements(): IViewElement[] {
        return this.sortUnique(this.parties).concat(this.sortUnique(this.badges));
    }

    sortUnique(input: IViewElement[]): IViewElement[] {
        const c = input.slice().sort((a, b) => a.desc.datetime.compare(b.desc.datetime) * -1);
        return c.filter((re, i) =>
            c.findIndex((r) => r.desc.uniqueName === re.desc.uniqueName) === i);
    }

    async updateAddParty() {
        try {
            this.canAddParty = isAdmin &&
                uData.spawnerInstance &&
                uData.personhoodPublished &&
                await uData.canPay(uData.spawnerInstance.costs.costParty.value);
        } catch (e) {
            Log.catch(e);
            this.canAddParty = false;
        }
    }

    updateBadges() {
        this.badges = uData.badges.map((b) => new BadgeView(b))
            .sort((a, b) => a.desc.datetime.sub(b.desc.datetime).toNumber());
        this.notifyPropertyChange("elements", this.elements);
    }

    async updateParties() {
        await uData.updateParties();
        this.parties = uData.parties.map((p) => new PartyView(p))
            .sort((a, b) => a.party.partyInstance.popPartyStruct.description.datetime.sub(
                b.party.partyInstance.popPartyStruct.description.datetime).toNumber());
        if (this.parties.length > 0) {
            this.parties[0].setChosen(true);
        }
        this.notifyPropertyChange("elements", this.elements);
    }

    setProgress(text: string = "", width: number = 0) {
        Log.lvl2("setting progress to", text, width);
        if (width === 0) {
            elements.set("networkStatus", null);
        } else {
            let color = "#308080;";
            if (width < 0) {
                color = "#a04040";
            }
            const pb = topmost().getViewById("progress_bar");
            if (pb) {
                pb.setInlineStyle("width:" + Math.abs(width) + "%; background-color: " + color);
            }
            elements.set("networkStatus", text);
        }
    }
}

interface IViewElement {
    desc: PopDesc;
    qrcode: ImageSource;
    icon: ImageSource;
    bgcolor: string;
    showDetails: boolean;
    nextStep: string;
    stepWidth: string;

    onTap(arg: GestureEventData);
}

function getImage(name: string): ImageSource {
    const folder: Folder = knownFolders.currentApp() as Folder;
    const folderPath: string = path.join(folder.path, "images", name);
    return fromFile(folderPath) as ImageSource;
}

export class BadgeView extends Observable {
    desc: PopDesc;
    showDetails = false;

    constructor(public badge: Badge) {
        super();
        this.desc = badge.party.partyInstance.popPartyStruct.description;
    }

    get qrcode(): ImageSource {
        return null;
    }

    get icon(): ImageSource {
        return getImage("icon-personhood-64.png");
    }

    get bgcolor(): string {
        return "badge";
    }

    get nextStep(): string {
        if (this.badge.mined) {
            return null;
        }
        if (uData.contact.isRegistered()) {
            return localize("personhood.mine_coins");
        } else {
            return localize("personhood.register");
        }
    }

    get stepWidth(): string {
        return null;
    }

    async onTap(arg: GestureEventData) {
        const pi = this.badge.party.partyInstance.popPartyStruct;
        const p = pi.description;
        const orgAtt = sprintf("Organizers: %d - Attendees: %d",
            pi.organizers, pi.attendees.keys.length - pi.organizers);
        const details = [p.name.toUpperCase(), p.purpose, orgAtt,
            p.dateString.replace(/:00$/, ""), p.location].join("\n");
        if (this.badge.mined) {
            return msgOK(details, "Details for badge");
        }
        try {
            const registered = uData.contact.isRegistered();
            if (registered) {
                elements.setProgress(localize("personhood.mining"), 50);
            } else {
                elements.setProgress(localize("personhood.registering"), 50);
            }
            await this.badge.mine(uData);
            elements.setProgress(localize("progress.saving"), 80);
            await finishData();
            elements.setProgress(localize("progress.done"), 100);
            await msgOK("Successfully mined\n" + details, "Details for badge");
            if (!registered) {
                appRootMain();
            }
        } catch (e) {
            Log.catch(e);
            elements.setProgress(localize("progress.error", e.toString()), -100);
            await msgFailed("Couldn't mine:\n" + e.toString());
            this.badge.mined = true;
        }
        await uData.save();
        elements.setProgress();
        await this.notifyPropertyChange("nextStep", this.nextStep);
    }
}

export class PartyView extends Observable {
    desc: PopDesc;
    chosen: boolean;
    showDetails = true;
    qrCache: ImageSource = undefined;

    constructor(public party: PartyItem) {
        super();
        this.desc = party.partyInstance.popPartyStruct.description;
    }

    get qrcode(): ImageSource {
        if (this.chosen &&
            this.party.state === PopPartyInstance.SCANNING &&
            !this.party.isOrganizer) {
            if (!this.qrCache) {
                this.qrCache = partyQrcode(uData.keyPersonhood._public,
                    this.party.partyInstance.popPartyStruct.description.name);
            }
            return this.qrCache;
        } else {
            this.qrCache = null;
        }
        return null;
    }

    get icon(): ImageSource {
        return null;
    }

    get bgcolor(): string {
        if (this.party.isOrganizer) {
            return "party-owner";
        }
        return this.chosen ? "party-participate" : "party-available";
    }

    get nextStep(): string {
        if (this.party.isOrganizer) {
            return ["Waiting for barrier point",
                "Scan attendees' public keys",
                "Finalize the party"][this.party.state - 1];
        }
        if (!this.chosen) {
            return null;
        }
        return ["Show up at party",
            "Get your qrcode scanned",
            "Mining coins"][this.party.state - 1];
    }

    get stepWidth(): string {
        if (!this.chosen && !this.party.isOrganizer) {
            return null;
        }
        return sprintf("%d%%", (this.party.state * 25));
    }

    showQrcode() {
        topmost().showModal("pages/modal/modal-key", partyQrcode(uData.keyPersonhood._public,
            this.party.partyInstance.popPartyStruct.description.name),
            () => {Log.lvl3("done"); }, false, false, false);
    }

    setChosen(c: boolean) {
        if (c) {
            elements.parties.forEach((p) => p.setChosen(false));
        }
        this.chosen = c;
        ["bgcolor", "qrcode", "nextStep", "stepWidth"].forEach(
            (key) => this.notifyPropertyChange(key, this[key]));
    }

    async onTap(arg: GestureEventData) {
        const DELETE = "Delete Party";
        const BARRIER = "Activate Barrier Point";
        const SCAN = "Scan attendees";
        const FINALIZE = "Finalize Party";
        const actions = [];
        if (this.party.isOrganizer) {
            switch (this.party.state) {
                case 1:
                    actions.push(BARRIER);
                    break;
                case 2:
                    actions.push(SCAN);
                    actions.push(FINALIZE);
                    break;
                case 3:
                    break;
            }
        } else if (!this.chosen) {
            this.setChosen(true);
            return;
        }
        actions.push(DELETE);
        try {
            // tslint:disable:object-literal-sort-keys
            switch (await dialogs.action({
                title: "Action for " + this.party.partyInstance.popPartyStruct.description.name,
                cancelButtonText: "Don't do anything",
                actions,
            })) {
                case DELETE:
                    if (await dialogs.confirm({
                        title: "Delete " + this.party.partyInstance.popPartyStruct.description.name,
                        message: "Are you sure to delete that party? There is no way back.",
                        okButtonText: "Delete Party",
                        cancelButtonText: "Cancel",
                        // tslint:enable:object-literal-sort-keys
                    })) {
                        elements.setProgress(localize("personhood.deleting"), 20);
                        const index = uData.parties.findIndex((p) => this.party === p);
                        await uData.phrpc.deleteParty(uData.parties[index].partyInstance.id,
                            IdentityWrapper.fromIdentity(uData.keyIdentitySigner));
                        uData.parties.splice(index, 1);
                        elements.setProgress(localize("personhood.updating_parties"), 50);
                        await elements.updateParties();
                        elements.setProgress(localize("personhood.parties_updated"), 100);
                        await uData.save();
                        elements.setProgress();
                    }
                    break;
                case BARRIER:
                    elements.setProgress(localize("personhood.barrier"), 50);
                    await this.party.partyInstance.activateBarrier([uData.keyIdentitySigner]);
                    elements.setProgress();
                    break;
                case SCAN:
                    const orgKeys = await uData.fetchOrgKeys(this.party.partyInstance);
                    orgKeys.forEach((key) => this.party.partyInstance.addAttendee(key));
                    return topmost().navigate({
                        context: this.party,
                        moduleName: "pages/lab/personhood/scan-atts/scan-atts-page",
                    });
                    break;
                case FINALIZE:
                    elements.setProgress(localize("personhood.finalizing"), 40);
                    await this.party.partyInstance.finalize([uData.keyIdentitySigner]);
                    if (this.party.partyInstance.popPartyStruct.state === PopPartyInstance.FINALIZED) {
                        elements.setProgress(localize("personhood.updating_parties"), 70);
                        await elements.updateParties();
                        await elements.updateBadges();
                        await msgOK("Finalized the party");
                    } else {
                        elements.setProgress(localize("personhood.finalized"), 100);
                        await msgOK("Waiting for other organizers to finalize");
                    }
                    elements.setProgress();
            }

            this.setChosen(true);
        } catch (e) {
            Log.catch(e);
            await msgFailed("Error occured: " + e.toString());
            elements.setProgress();
        }
    }
}
