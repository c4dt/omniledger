import Timer = NodeJS.Timer;
import { Component, ElementRef, Inject, OnInit, Renderer2, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { BcviewerService } from "../app/bcviewer/bcviewer.component";
import { TWorker } from "./Ui";

export interface IDialogTransactionConfig {
    title: string;
    worker: TWorker;
}

@Component({
    selector: "app-dialog-transaction",
    styleUrls: ["./dialog-transaction.scss"],
    templateUrl: "dialog-transaction.html",
})
export class DialogTransactionComponent implements OnInit {

    static progress(dtc: DialogTransactionComponent, percentage: number, text: string) {
        dtc.percentage = percentage >= 0 ? percentage : percentage * -1;

        if (dtc.percentage >= 100) {
            clearTimeout(dtc.ubTimer);
            dtc.blockIndex++;
            dtc.addBlock();
            setTimeout(() => {
                dtc.dialogRef.close();
            }, 1000);
        }

        if (percentage >= 0) {
            dtc.text = "";
            dtc.addTransaction(text);
        } else {
            dtc.text = text;
        }
    }

    percentage: number;
    blockIndex: number;
    text: string;
    error: string;

    private blocks: Element[] = [];
    private transaction: Element;
    @ViewChild("main", {static: false}) private main?: ElementRef;
    private ubTimer: Timer;

    constructor(
        readonly dialogRef: MatDialogRef<DialogTransactionComponent>,
        private readonly bcv: BcviewerService,
        private readonly renderer: Renderer2,
        @Inject(MAT_DIALOG_DATA) public data: IDialogTransactionConfig) {
    }

    async ngOnInit() {
        this.bcv.updateBlocks();
        this.ubTimer = setInterval(() => this.updateBlocks(), 500);
        setTimeout(() => this.startTransactions(), 200);
    }

    async updateBlocks() {
        this.bcv.updateBlocks();
        if (this.blockIndex < this.bcv.currentBlock.index) {
            this.blockIndex = this.bcv.currentBlock.index;
            this.addBlock();
        }
    }

    async startTransactions() {
        this.blockIndex = this.bcv.currentBlock.index;
        for (let i = -2; i <= 0; i++) {
            this.addBlock(this.blockIndex + i);
        }
        const prog = (p: number, t: string) => DialogTransactionComponent.progress(this, p, t);
        try {
            await this.data.worker(prog);
            prog(-100, "Done");
        } catch (e) {
            this.error = e.toString();
        }
    }

    addBlock(index: number = this.blockIndex): Element {
        const block = this.renderer.createElement("DIV");
        const txt = this.renderer.createText(index.toString());
        block.appendChild(txt);
        this.main.nativeElement.appendChild(block);
        block.classList.add("block");
        this.blocks.unshift(block);
        for (let i = 0; i < this.blocks.length; i++) {
            this.blocks[i].classList.remove("block" + i);
            this.blocks[i].classList.add("block" + (i + 1));
        }
        if (this.blocks.length > 4) {
            this.main.nativeElement.removeChild(this.blocks[4]);
            this.blocks.splice(4);
        }
        if (this.transaction) {
            this.transaction.classList.remove("tx-send");
            // void this.transaction.offsetWidth;
            this.transaction.classList.add("tx-block");
            this.transaction = null;
        }
        return block;
    }

    addTransaction(text: string) {
        if (this.transaction) {
            this.blockIndex++;
            this.addBlock();
        }
        this.transaction = this.renderer.createElement("DIV");
        const txt = this.renderer.createText(text);
        this.transaction.appendChild(txt);
        this.main.nativeElement.appendChild(this.transaction);
        this.transaction.classList.add("transaction");
        this.transaction.classList.add("tx-send");
    }
}
