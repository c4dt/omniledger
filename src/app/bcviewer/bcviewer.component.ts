import { Component, EventEmitter, Inject, Injectable, OnInit, Output } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material";
import { Instruction } from "@c4dt/cothority/byzcoin";
import { DataBody, DataHeader } from "@c4dt/cothority/byzcoin/proto";
import TxResult from "@c4dt/cothority/byzcoin/proto/tx-result";
import { ForwardLink, SkipBlock, SkipchainRPC } from "@c4dt/cothority/skipchain";
import Long from "long";
import { sprintf } from "sprintf-js";
import { gData } from "../../lib/Data";

@Injectable({
    providedIn: "root",
})
export class BcviewerService {

    @Output() update: EventEmitter<boolean> = new EventEmitter();

    updateBlocks() {
        this.update.emit(true);
    }

}

@Component({
    selector: "app-bcviewer",
    styleUrls: ["./bcviewer.component.css"],
    templateUrl: "./bcviewer.component.html",
})
export class BcviewerComponent implements OnInit {
    scRPC: SkipchainRPC;
    blocks: BCBlock[];

    constructor(private showBlockService: BcviewerService,
                private dialog: MatDialog) {
        setTimeout(() => {
            this.updateBlocks();
        }, 2000);
        setInterval(() => {
            this.updateBlocks();
        }, 30000);
    }

    async updateBlocks() {
        if (gData.bc) {
            this.scRPC = new SkipchainRPC(gData.bc.getConfig().roster);
            const sbBlocks = await this.scRPC.getUpdateChain(gData.bc.genesisID);
            this.blocks = sbBlocks.map((sb) => new BCBlock(this.scRPC, sb));
            if (this.blocks.length > 4) {
                this.blocks.splice(0, this.blocks.length - 4);
            }
        }
    }

    async showBlock(block: BCBlock) {
        this.dialog.open(ShowBlockComponent,
            {width: "80%", data: block});
    }

    ngOnInit() {
        this.showBlockService.update.subscribe((update) => {
            if (update) {
                this.updateBlocks();
            }
        });
    }
}

class BCBlock {
    header: DataHeader;
    body: DataBody;
    time: Date;
    timeStr: string;
    forwardLinks: Link[] = [];
    backwardLinks: Link[] = [];

    constructor(public scRPC: SkipchainRPC, public sb: SkipBlock) {
        this.sb = sb;
        this.header = DataHeader.decode(sb.data);
        this.body = DataBody.decode(sb.payload);
        this.time = new Date(this.header.timestamp.div(Long.fromNumber(1e6)).toNumber());
        this.timeStr = sprintf("%02d/%02d/%d %02d:%02d", this.time.getDate(),
            this.time.getMonth() + 1, this.time.getFullYear(),
            this.time.getHours(), this.time.getMinutes());
        this.forwardLinks = sb.forwardLinks.map((fl) => new Link(scRPC, fl));
        if (sb.index > 0) {
            this.backwardLinks = sb.backlinks.map((fl) => new Link(scRPC, fl));
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
        public dialogRef: MatDialogRef<ShowBlockComponent>,
        @Inject(MAT_DIALOG_DATA) public data: BCBlock) {
        this.updateVars();
    }

    updateVars() {
        this.roster = this.data.sb.roster.list.map((l) => l.description);
        this.ctxs = this.data.body.txResults.map((txr, index) => new TxStr(txr, index));
    }

    async goBlock(l: Link) {
        const sb = await this.data.scRPC.getSkipBlock(l.id);
        this.data = new BCBlock(this.data.scRPC, sb);
        this.updateVars();
    }
}

class TxStr {
    instructions: InstStr[];
    accepted: boolean;

    constructor(tx: TxResult, public index: number) {
        this.instructions = tx.clientTransaction.instructions.map((inst, ind) => new InstStr(inst, ind));
        this.accepted = tx.accepted;
    }
}

class InstStr {
    type: string;
    args: string[];
    contractID: string;
    command: string;

    constructor(public inst: Instruction, public index: number) {
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
    }
}

class Link {
    index: number;
    height: number;
    maxHeight: number;
    id: Buffer;

    constructor(sbRPC: SkipchainRPC, link: (ForwardLink | Buffer)) {
        if (Buffer.isBuffer(link)) {
            this.id = link as Buffer;
        } else {
            this.id = (link as ForwardLink).to;
        }
        sbRPC.getSkipBlock(this.id).then((sb) => {
            this.index = sb.index;
            this.height = sb.forwardLinks.length;
            this.maxHeight = sb.height;
        });
    }
}
