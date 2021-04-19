import { Component, ElementRef, Inject, OnInit, Renderer2, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Log } from "@dedis/cothority";
import { Subscription } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { ByzCoinService } from "../app/byz-coin.service";
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

    percentage = 0;
    text: string;
    error: Error | undefined;

    private blocks: Element[] = [];
    private transaction: Element;
    private ub: Subscription;
    @ViewChild("main") private main?: ElementRef;

    constructor(
        private bcs: ByzCoinService,
        readonly dialogRef: MatDialogRef<DialogTransactionComponent<T>>,
        private readonly renderer: Renderer2,
        @Inject(MAT_DIALOG_DATA) public data: IDialogTransactionConfig<T>) {
    }

    async ngOnInit() {
        const last = this.bcs.bc.latest.index;
        this.ub = (await this.bcs.bc.getNewBlocks()).pipe(
            map((block) => block.index),
            startWith(last - 3, last - 2, last - 1),
        ).subscribe((nb) => this.updateBlocks(nb));
    }

    updateBlocks(index: number) {
        const start = this.blocks.length === 3;
        this.addBlock(index);
        if (start) {
            this.startTransactions();
        }
    }

    async startTransactions() {
        const prog = (p: number, t: string) => this.progress(p, t);
        try {
            const result = await this.data.worker(prog);
            prog(-100, "Done");
            this.ub.unsubscribe();
            setTimeout(() => {
                this.dialogRef.close(result);
            }, 1000);
        } catch (e) {
            this.ub.unsubscribe();
            Log.catch(e);
            this.error = e;
        }
    }

    addBlock(index: number): Element {
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
        this.transaction = this.renderer.createElement("DIV");
        const txt = this.renderer.createText(text);
        this.transaction.appendChild(txt);
        this.main.nativeElement.appendChild(this.transaction);
        this.transaction.classList.add("transaction");
        this.transaction.classList.add("tx-send");
    }

    progress(percentage: number, text: string) {
        this.percentage = percentage >= 0 ? percentage : percentage * -1;
        Log.lvl2("Progress:", percentage, text);

        if (percentage >= 0) {
            this.text = "";
            this.addTransaction(text);
        } else {
            this.text = text;
        }
    }
}
