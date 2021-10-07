import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import Long from "long";
import { sprintf } from "sprintf-js";

import { ByzCoinRPC, InstanceID, Instruction } from "@dedis/cothority/byzcoin";
import Instance from "@dedis/cothority/byzcoin/instance";
import Proof from "@dedis/cothority/byzcoin/proof";
import DataBody from "@dedis/cothority/byzcoin/proto/data-body";
import DataHeader from "@dedis/cothority/byzcoin/proto/data-header";
import TxResult from "@dedis/cothority/byzcoin/proto/tx-result";
import CredentialsInstance, { CredentialStruct } from "@dedis/cothority/personhood/credentials-instance";
import { SkipBlock } from "@dedis/cothority/skipchain";
import SkipchainRPC from "@dedis/cothority/skipchain/skipchain-rpc";
import { AddressBook, CredentialStructBS } from "dynacred";
import { ByzCoinService } from "src/app/byz-coin.service";
import { UserService } from "src/app/user.service";

@Component({
    selector: "app-bcviewer",
    styleUrls: ["./bcviewer.component.scss"],
    templateUrl: "./bcviewer.component.html",
})
export class BcviewerComponent implements OnInit {
    scRPC: SkipchainRPC;
    blocks: BCBlock[] = [];

    constructor(private dialog: MatDialog,
                private bcs: ByzCoinService) {
    }

    async updateBlock(block: SkipBlock) {
        this.blocks.push(new BCBlock(this.scRPC, block));
        while (this.blocks.length < 4 && this.blocks[0].sb.index > 0) {
            const sbRep = await this.scRPC.getSkipBlockByIndex(this.bcs.bc.genesisID,
                this.blocks[0].sb.index - 1);
            this.blocks.unshift(new BCBlock(this.scRPC, sbRep.skipblock));
        }
        if (this.blocks.length > 4) {
            this.blocks.splice(0, this.blocks.length - 4);
        }
    }

    async showBlock(block: BCBlock) {
        this.dialog.open(ShowBlockComponent,
            {width: "80%", data: block});
    }

    async ngOnInit() {
        this.scRPC = new SkipchainRPC(this.bcs.conn);
        (await this.bcs.bc.getNewBlocks()).subscribe((block) => this.updateBlock(block));
    }
}

export class BCBlock {
    header: DataHeader;
    body: DataBody;
    time: Date;
    timeStr: string;
    forwardLinks: ForwardLinkBlock[] = [];
    backwardLinks: BackwardLinkBlock[] = [];

    constructor(public scRPC: SkipchainRPC, public sb: SkipBlock) {
        this.sb = sb;
        this.header = DataHeader.decode(sb.data);
        this.body = DataBody.decode(sb.payload);
        this.time = new Date(this.header.timestamp.div(Long.fromNumber(1e6)).toNumber());
        this.timeStr = sprintf("%02d/%02d/%d %02d:%02d", this.time.getDate(),
            this.time.getMonth() + 1, this.time.getFullYear(),
            this.time.getHours(), this.time.getMinutes());
    }

    async updateLinks() {
        this.forwardLinks = this.sb.forwardLinks.map((_, i) => new ForwardLinkBlock(this.sb, i));
        if (this.sb.index > 0) {
            this.backwardLinks = this.sb.backlinks.map((_, i) => new BackwardLinkBlock(this.sb, i));
        }
    }
}

@Component({
    selector: "app-show-block",
    styleUrls: ["show-block.scss", "bcviewer.component.scss"],
    templateUrl: "show-block.html",
})
export class ShowBlockComponent {
    roster: string[];
    ctxs: TxStr[];

    constructor(
        private dialogRef: MatDialogRef<ShowBlockComponent>,
        private bcs: ByzCoinService,
        private user: UserService,
        @Inject(MAT_DIALOG_DATA) public data: BCBlock) {
        this.updateVars();
        data.updateLinks();
    }

    updateVars() {
        this.roster = this.data.sb.roster.list.slice(1).map((l) => l.description);
        this.ctxs = this.data.body.txResults.map((txr, index) =>
            new TxStr(this.user.credStructBS, this.user.addressBook, txr, index));
    }

    async goBlock(id: Buffer) {
        const sb = await this.data.scRPC.getSkipBlock(id);
        this.data = new BCBlock(this.data.scRPC, sb);
        this.updateVars();
        await this.data.updateLinks();
    }
}

class TxStr {
    instructions: InstStr[];
    accepted: boolean;

    constructor(userCred: CredentialStructBS, address: AddressBook, tx: TxResult, public index: number) {
        this.instructions = tx.clientTransaction.instructions.map((inst, ind) =>
            new InstStr(userCred, address, inst, ind));
        this.accepted = tx.accepted;
    }
}

class InstStr {
    type: string;
    args: string[];
    contractID: string;
    command: string;
    description: string | undefined;

    constructor(private userCred: CredentialStructBS, private address: AddressBook, public inst: Instruction, public index: number) {
        switch (inst.type) {
            case 0:
                this.type = "spawn";
                this.args = inst.spawn.args.map((arg) => arg.name);
                this.contractID = inst.spawn.contractID;
                this.description = `Spawn call to ${this.contractID}`;
                break;
            case 1:
                this.type = "invoke";
                this.args = inst.invoke.args.map((arg) => arg.name);
                this.contractID = inst.invoke.contractID;
                this.command = inst.invoke.command;
                this.description = this.getDescription(inst.instanceID);
                break;
            case 2:
                this.type = "delete";
                this.contractID = inst.delete.contractID;
                this.description = this.getDescription(inst.instanceID);
                break;
        }
    }

    getDescription(id: InstanceID): string {
        switch (this.contractID) {
            case "config":
                return "Genesis Configuration";
            case CredentialsInstance.contractID:
                if (this.userCred.id.equals(id)) {
                    return this.userCred.credPublic.alias.getValue();
                }
                const cred = this.address.contacts.getValue().find((c) => c.id.equals(id));
                if (cred) {
                    return `Credential '${cred.credPublic.alias.getValue()}'`;
                }
                return "Unknown Credential";
        }
        return this.contractID;
    }
}

class ForwardLinkBlock {
    index: number;
    maxHeight: number;
    sign: string = "";
    id: Buffer;

    constructor(sb: SkipBlock, height: number) {
        const link = sb.forwardLinks[height];
        this.id = link.to;
        // TODO: extend to more than 32 nodes
        const maskBuf = Buffer.alloc(4);
        link.signature.getMask().copy(maskBuf);
        const mask = Buffer.from(maskBuf.reverse()).readInt32BE(0);
        const roster = link.newRoster || sb.roster;
        roster.list.forEach((_, i) => {
            // tslint:disable-next-line:no-bitwise
            this.sign += (mask & (1 << i)) !== 0 ? "x" : "-";
        });

        this.index = sb.index + Math.pow(sb.baseHeight, height);
        this.maxHeight = sb.height;
    }
}

class BackwardLinkBlock {
    index: number;
    id: Buffer;

    constructor(sb: SkipBlock, height: number) {
        this.id = sb.backlinks[height];
        this.index = sb.index - Math.pow(sb.baseHeight, height);
    }
}

class LinkInstance {
    instanceID: Buffer;
    description: string;
    instanceProof: Proof;

    constructor(bc: ByzCoinRPC, public inst: Instruction, public contractID: string) {
        this.instanceID = inst.instanceID;
        this.description = "loading...";
        bc.getProofFromLatest(this.instanceID, undefined, undefined, false).then((p) => {
            this.instanceProof = p;
            switch (contractID) {
                case "config":
                    this.description = "Genesis Configuration";
                    break;
                case CredentialsInstance.contractID:
                    this.description = "Credential -> ";
                    let cred: CredentialStruct;
                    switch (inst.type) {
                        case 0:
                            const credBuf = inst.spawn.args.find((arg) => {
                                return arg.name === CredentialsInstance.argumentCredential;
                            });
                            if (credBuf) {
                                cred = CredentialStruct.decode(credBuf.value);
                            }
                            break;
                        case 1:
                        case 2:
                            const i = Instance.fromProof(this.instanceID, this.instanceProof);
                            cred = CredentialStruct.decode(i.data);
                            break;
                    }
                    if (cred) {
                        const aliasBuf = cred.getAttribute("1-public", "alias");
                        if (aliasBuf) {
                            this.description += aliasBuf.toString();
                        } else {
                            this.description += "unknown";
                        }
                    }
                    break;
                default:
                    this.description = contractID;
            }
        });
    }
}
