import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatSelectChange } from "@angular/material";
import { curve } from "@dedis/kyber";
import DarcInstance from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import { Darc, IdentityEd25519, IIdentity, Rules } from "@c4dt/cothority/darc";
import IdentityDarc from "@c4dt/cothority/darc/identity-darc";
import IdentityWrapper from "@c4dt/cothority/darc/identity-wrapper";
import { Log } from "@c4dt/cothority/log";
import { gData } from "../../lib/Data";

export interface IManageDarc {
    title: string;
    darc: Darc;
    filter: string;
    rule: string;
}

interface IItem {
    label: string;
    identity: IdentityWrapper;
}

interface INewRule {
    value: string;
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
    rule: string = Darc.ruleSign;

    constructor(
        public dialogRef: MatDialogRef<ManageDarcComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IManageDarc) {
        if (!data.title || data.title === "") {
            data.title = "Manage access rights";
        }
        if (data.rule && data.rule !== "") {
            this.rule = data.rule;
        }
        this.newDarc = data.darc.evolve();
        this.getItems(data.filter).then((items) => {
            this.available = items;
            this.ruleChange({value: this.rule});
        });
    }

    ruleChange(newRule: INewRule) {
        this.available = this.available.concat(this.chosen);
        this.available = this.available.filter((i) => i.label !== "Unknown");
        this.chosen = [];

        const expr = this.newDarc.rules.getRule(this.rule).expr.toString();
        if (expr.indexOf("&") >= 0) {
            throw new Error("cannot handle darcs with AND");
        }
        const identities = expr.split("|");
        for (const identity of identities) {
            const idStr = identity.trim();
            this.add(IdentityWrapper.fromIdentity(new IdStub(idStr)), false);
        }
    }

    createItem(label: string, iid: IIdentity): IItem {
        const idw = IdentityWrapper.fromIdentity(iid);
        return {
            identity: idw,
            label,
        };
    }

    async getItems(filter: string): Promise<IItem[]> {
        const items: IItem[] = [];
        if (filter.indexOf("contact") >= 0) {
            for (const contact of gData.contact.contacts) {
                items.push(this.createItem("Contact: " + contact.alias,
                    await contact.getDarcSignIdentity()));
            }
        }
        if (filter.indexOf("action") >= 0) {
            for (const action of await gData.contact.getActions()) {
                items.push(this.createItem("Action: " + action.darc.description.toString(),
                    new IdentityDarc({id: action.id})));
            }
        }
        if (filter.indexOf("group") >= 0) {
            for (const group of await gData.contact.getGroups()) {
                items.push(this.createItem("Group: " + group.darc.description.toString(),
                    new IdentityDarc({id: group.id})));
            }
        }
        items.unshift(this.createItem("Ourselves: " + gData.contact.alias,
            await gData.contact.getDarcSignIdentity()));
        return items;
    }

    add(id: IdentityWrapper, update: boolean = true) {
        const index = this.available.findIndex((i) => i.identity.toString() === id.toString());
        if (index >= 0) {
            this.chosen.push(this.available[index]);
            this.available.splice(index, 1);
        } else {
            this.chosen.push({label: "Unknown", identity: id});
        }
        if (update) {
            this.updateDarc();
        }
    }

    remove(id: IdentityWrapper) {
        const index = this.chosen.findIndex((i) => i.identity.toString() === id.toString());
        if (index >= 0) {
            this.available.push(this.chosen[index]);
            this.chosen.splice(index, 1);
        }
        this.updateDarc();
    }

    cancel(): void {
        this.dialogRef.close();
    }

    updateDarc() {
        if (this.chosen.length > 0) {
            this.newDarc.rules.setRule(this.rule, this.idWrapToId(this.chosen[0].identity));
            this.chosen.slice(1).forEach((item) => {
                this.newDarc.rules.appendToRule(this.rule, this.idWrapToId(item.identity), Rules.OR);
            });
        }
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
    constructor(private id: string) {
    }

    verify(msg: Buffer, signature: Buffer): boolean {
        return false;
    }

    /**
     * Get the byte array representation of the public key of the identity
     * @returns the public key as buffer
     */
    toBytes(): Buffer {
        return null;
    }

    /**
     * Get the string representation of the identity
     * @return a string representation
     */
    toString(): string {
        return this.id;
    }

}
