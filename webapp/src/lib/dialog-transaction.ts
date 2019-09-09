import Timer = NodeJS.Timer;
import { Component, ElementRef, Inject, OnInit, Renderer2, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { BcviewerService } from "../app/bcviewer/bcviewer.component";
import { TWorker } from "./Ui";

export interface IDialogTransactionConfig<T> {
    title: string;
    worker: TWorker<T>;
}

@Component({
    selector: "app-dialog-transaction",
    styleUrls: ["./dialog-transaction.scss"],
    templateUrl: "dialog-transaction.html",
})
export class DialogTransactionComponent<T> implements OnInit {

    percentage: number;
    blockIndex: number;
    text: string;
    error: string;

    private blocks: Element[] = [];
    private transaction: Element;
    @ViewChild("main", {static: false}) private main?: ElementRef;
    private ubTimer: Timer;

    constructor(
        readonly dialogRef: MatDialogRef<DialogTransactionComponent<T>>,
        private readonly bcv: BcviewerService,
        private readonly renderer: Renderer2,
        @Inject(MAT_DIALOG_DATA) public data: IDialogTransactionConfig<T>) {
    }

    async ngOnInit() {
        this.bcv.updateBlocks();
        this.ubTimer = setInterval(() => this.updateBlocks(), 500);
        setTimeout(() => this.startTransactions(), 200);
    }

    async updateBlocks() {
        this.bcv.updateBlocks();
        if (this.bcv.currentBlock &&
            this.blockIndex < this.bcv.currentBlock.index) {
            this.blockIndex = this.bcv.currentBlock.index;
            this.addBlock();
        }
    }

    async startTransactions() {
        this.blockIndex = this.bcv.currentBlock.index;
        for (let i = -2; i <= 0; i++) {
            this.addBlock(this.blockIndex + i);
        }
        const prog = (p: number, t: string) => this.progress(p, t);
        try {
            const result = await this.data.worker(prog);
            prog(-100, "Done");
            clearTimeout(this.ubTimer);
            this.blockIndex++;
            this.addBlock();
            setTimeout(() => {
                this.dialogRef.close(result);
            }, 1000);
        } catch (e) {
            clearTimeout(this.ubTimer);
            this.error = e.toString();
        }
    }

    addBlock(index: number = this.blockIndex): Element {
        if (!this.main) {
            return undefined;
        }
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

    progress(percentage: number, text: string) {
        this.percentage = percentage >= 0 ? percentage : percentage * -1;

        if (percentage >= 0) {
            this.text = "";
            this.addTransaction(text);
        } else {
            this.text = text;
        }
    }

}
