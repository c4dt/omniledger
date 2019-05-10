import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import DarcInstance from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import { Darc, IdentityEd25519, IIdentity, Rules } from "@c4dt/cothority/darc";
import IdentityDarc from "@c4dt/cothority/darc/identity-darc";
import IdentityWrapper from "@c4dt/cothority/darc/identity-wrapper";
import { Log } from "@c4dt/cothority/log";
import { curve } from "@dedis/kyber";
import { gData } from "../../lib/Data";

export interface IManageDarc {
    title: string;
    darc: Darc;
}

interface IItem {
    label: string;
    identity: IdentityWrapper;
}

@Component({
    selector: "app-manage-darc",
    styleUrls: ["manage-darc.css"],
    templateUrl: "manage-darc.html",
})
export class ManageDarcComponent {
    newDarc: Darc;
    available: IItem[] = [];
    chosen: IItem[] = [];
    rule: string = DarcInstance.commandSign;

    constructor(
        public dialogRef: MatDialogRef<ManageDarcComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IManageDarc) {
        if (!data.title || data.title === "") {
            data.title = "Manage access rights";
        }
        this.newDarc = data.darc.evolve();
        this.getItems().then((items) => {
            this.available = items;
            const sign = this.newDarc.rules.getRule(this.rule).expr.toString();
            if (sign.indexOf("&") >= 0) {
                throw new Error("cannot handle darcs with AND");
            }
            const identities = sign.split("|");
            for (const identity of identities) {
                const idStr = identity.trim();
                Log.print("adding id", idStr);
                this.add(IdentityWrapper.fromIdentity(new IdStub(idStr)));
            }
        });
    }

    createItem(label: string, iid: IIdentity): IItem {
        const idw = IdentityWrapper.fromIdentity(iid);
        Log.print("creating", label, idw);
        return {
            identity: idw,
            label,
        };
    }

    async getItems(): Promise<IItem[]> {
        const items: IItem[] = [];
        items.push(this.createItem("Ourselves: " + gData.contact.alias,
            await gData.contact.getDarcSignIdentity()));
        for (const contact of gData.contact.contacts) {
            items.push(this.createItem("Contact: " + contact.alias,
                await contact.getDarcSignIdentity()));
        }
        for (const action of await gData.contact.getActions()) {
            items.push(this.createItem("Action: " + action.darc.description.toString(),
                new IdentityDarc({id: action.id})));
        }
        for (const group of await gData.contact.getGroups()) {
            items.push(this.createItem("Group: " + group.darc.description.toString(),
                new IdentityDarc({id: group.id})));
        }
        return items;
    }

    add(id: IdentityWrapper) {
        Log.print(id);
        Log.print(this.available);
        const index = this.available.findIndex((i) => i.identity.toString() === id.toString());
        if (index >= 0) {
            this.chosen.push(this.available[index]);
            this.available.splice(index, 1);
        } else {
            this.chosen.push({label: "original", identity: id});
        }
    }

    remove(id: IdentityWrapper) {
        const index = this.chosen.findIndex((i) => i.identity.toString() === id.toString());
        if (index >= 0) {
            this.available.push(this.chosen[index]);
            this.chosen.splice(index, 1);
        }
    }

    cancel(): void {
        this.dialogRef.close();
    }

    async createNewDarc(): Promise<Darc> {
        this.newDarc.rules.setRule(this.rule, this.idWrapToId(this.chosen[0].identity));
        this.chosen.slice(1).forEach((item) => {
            this.newDarc.rules.appendToRule(this.rule, this.idWrapToId(item.identity), Rules.OR);
        });
        const di = await DarcInstance.fromByzcoin(gData.bc, this.newDarc.getBaseID());
        await di.evolveDarcAndWait(this.newDarc, [gData.keyIdentitySigner], 5);
        return this.newDarc;
    }

    idWrapToId(idW: IdentityWrapper): IIdentity {
        const str = idW.toString();
        const curve25519 = curve.newCurve("edwards25519");

        if (str.startsWith("ed25519:")) {
            return new IdentityEd25519({point: Buffer.from(str.slice(8), "hex")});
        }
        if (str.startsWith("darc:")) {
            return new IdentityDarc({id: Buffer.from(str.slice(5), "hex")});
        }
    }
}

class IdStub {
    constructor(private id: string) {}
    verify(msg: Buffer, signature: Buffer): boolean {return false; }

    /**
     * Get the byte array representation of the public key of the identity
     * @returns the public key as buffer
     */
    toBytes(): Buffer {return null; }

    /**
     * Get the string representation of the identity
     * @return a string representation
     */
    toString(): string {return this.id; }

}
