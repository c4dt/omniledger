import { Component, EventEmitter, Inject, Injectable, OnInit, Output } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import Long from "long";
import { sprintf } from "sprintf-js";

import { ByzCoinRPC, Instruction } from "@dedis/cothority/byzcoin";
import Instance from "@dedis/cothority/byzcoin/instance";
import Proof from "@dedis/cothority/byzcoin/proof";
import DataBody from "@dedis/cothority/byzcoin/proto/data-body";
import DataHeader from "@dedis/cothority/byzcoin/proto/data-header";
import TxResult from "@dedis/cothority/byzcoin/proto/tx-result";
import CredentialsInstance, { CredentialStruct } from "@dedis/cothority/personhood/credentials-instance";
import { ForwardLink, SkipBlock } from "@dedis/cothority/skipchain";
import SkipchainRPC from "@dedis/cothority/skipchain/skipchain-rpc";
import { UserData } from "../user-data.service";

@Injectable({
    providedIn: "root",
})
export class BcviewerService {

    @Output() update: EventEmitter<void> = new EventEmitter();
    @Output() newStatus: EventEmitter<void> = new EventEmitter();
    currentBlock: SkipBlock;

    updateBlocks() {
        this.update.emit();
    }

}

@Component({
    selector: "app-bcviewer",
    styleUrls: ["./bcviewer.component.css"],
    templateUrl: "./bcviewer.component.html",
})
export class BcviewerComponent implements OnInit {
    scRPC: SkipchainRPC;
    blocks: BCBlock[] = [];

    constructor(private showBlockService: BcviewerService,
                private dialog: MatDialog,
                private uData: UserData) {
        setInterval(async () => {
            await this.updateBlocks();
        }, 30000);
        setTimeout(async () => {
            await this.updateBlocks();
        }, 1000);
    }

    async updateBlocks(): Promise<any> {
        if (this.uData.bc) {
            if (!this.scRPC) {
                this.scRPC = new SkipchainRPC(this.uData.conn);
            }
            let latest = this.uData.bc.genesisID;
            if (this.blocks && this.blocks.length > 0) {
                latest = this.blocks[this.blocks.length - 1].sb.hash;
            }
            const sbBlocks = await this.scRPC.getUpdateChain(latest, false);
            sbBlocks.forEach((sbB) => {
                if (!this.blocks.find((b) => b.sb.hash.equals(sbB.hash))) {
                    this.blocks.push(new BCBlock(this.scRPC, sbB));
                }
            });
            if (this.blocks.length > 4) {
                this.blocks.splice(0, this.blocks.length - 4);
            }
            this.showBlockService.currentBlock = this.blocks[this.blocks.length - 1].sb;
            this.showBlockService.newStatus.emit();
        }
    }

    async showBlock(block: BCBlock) {
        this.dialog.open(ShowBlockComponent,
            {width: "80%", data: block});
    }

    async ngOnInit() {
        this.showBlockService.update.subscribe(async () => {
            await this.updateBlocks();
        });
    }
}

export class BCBlock {
    header: DataHeader;
    body: DataBody;
    time: Date;
    timeStr: string;
    forwardLinks: LinkBlock[] = [];
    backwardLinks: LinkBlock[] = [];

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
        this.forwardLinks = this.sb.forwardLinks.map((fl) => new LinkBlock(this.scRPC, fl, this.sb));
        if (this.sb.index > 0) {
            this.backwardLinks = this.sb.backlinks.map((fl) => new LinkBlock(this.scRPC, fl));
        }
    }
}

@Component({
    selector: "app-show-block",
    styleUrls: ["show-block.css", "bcviewer.component.css"],
    templateUrl: "show-block.html",
})
export class ShowBlockComponent {
    roster: string[];
    ctxs: TxStr[];

    constructor(
        private dialogRef: MatDialogRef<ShowBlockComponent>,
        private uData: UserData,
        @Inject(MAT_DIALOG_DATA) public data: BCBlock) {
        this.updateVars();
        data.updateLinks();
    }

    updateVars() {
        this.roster = this.data.sb.roster.list.slice(1).map((l) => l.description);
        this.ctxs = this.data.body.txResults.map((txr, index) => new TxStr(this.uData.bc, txr, index));
    }

    async goBlock(l: LinkBlock) {
        const sb = await this.data.scRPC.getSkipBlock(l.id);
        this.data = new BCBlock(this.data.scRPC, sb);
        this.updateVars();
        await this.data.updateLinks();
    }
}

class TxStr {
    instructions: InstStr[];
    accepted: boolean;

    constructor(bc: ByzCoinRPC, tx: TxResult, public index: number) {
        this.instructions = tx.clientTransaction.instructions.map((inst, ind) => new InstStr(bc, inst, ind));
        this.accepted = tx.accepted;
    }
}

class InstStr {
    type: string;
    args: string[];
    contractID: string;
    command: string;
    instance: LinkInstance;

    constructor(bc: ByzCoinRPC, public inst: Instruction, public index: number) {
        switch (inst.type) {
            case 0:
                this.type = "spawn";
                this.args = inst.spawn.args.map((arg) => arg.name);
                this.contractID = inst.spawn.contractID;
                break;
            case 1:
                this.type = "invoke";
                this.args = inst.invoke.args.map((arg) => arg.name);
                this.contractID = inst.invoke.contractID;
                this.command = inst.invoke.command;
                break;
            case 2:
                this.type = "delete";
                this.contractID = inst.delete.contractID;
                break;
        }
        this.instance = new LinkInstance(bc, inst, this.contractID);
    }

    getInstanceStr(inst: Instruction): string {

        return inst.instanceID.toString("hex");
    }
}

class LinkBlock {
    index: number;
    height: number;
    maxHeight: number;
    sign: string = "";
    id: Buffer;

    constructor(sbRPC: SkipchainRPC, link: (ForwardLink | Buffer), sbNow?: SkipBlock) {
        if (Buffer.isBuffer(link)) {
            this.id = link as Buffer;
        } else {
            const l = (link as ForwardLink);
            this.id = l.to;
            if (sbNow !== undefined) {
                // TODO: extend to more than 32 nodes
                const maskBuf = Buffer.alloc(4);
                l.signature.getMask().copy(maskBuf);
                const mask = Buffer.from(maskBuf.reverse()).readInt32BE(0);
                const roster = l.newRoster || sbNow.roster;
                roster.list.forEach((_, i) => {
                    // tslint:disable-next-line:no-bitwise
                    this.sign += (mask & (1 << i)) !== 0 ? "x" : "-";
                });
            }
        }
        sbRPC.getSkipBlock(this.id).then((sb) => {
            this.index = sb.index;
            this.height = sb.forwardLinks.length;
            this.maxHeight = sb.height;
        });
    }
}

class LinkInstance {
    instanceID: Buffer;
    description: string;
    instanceProof: Proof;

    constructor(bc: ByzCoinRPC, public inst: Instruction, public contractID: string) {
        this.instanceID = inst.instanceID;
        this.description = "loading...";
        bc.getProofFromLatest(this.instanceID).then((p) => {
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
