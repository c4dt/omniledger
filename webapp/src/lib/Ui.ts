import { Component, ElementRef, Inject, OnInit, Renderer2, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import Log from "@dedis/cothority/log";
import { BcviewerService } from "../app/bcviewer/bcviewer.component";
import Timer = NodeJS.Timer;

export async function showSnack(snack: MatSnackBar, text: string, cmd: () => void) {
    let sb = snack.open(text);
    let err: Error;
    try {
        await cmd();
    } catch (e) {
        err = e;
    } finally {
        sb.dismiss();
    }
    if (err) {
        Log.error(err);
        // sb = snack.open("Error: " + text);
        sb = snack.open("Error: " + err.toString(), "", {
            duration: 3000,
            panelClass: "redBack",
        });
        throw new Error(err.toString());
    }
}

export async function showDialogOKC(dialog: MatDialog, title: string, text: string,
                                    result: (result: boolean) => void,
                                    buttons: IDialogOKCButtons = {OKButton: "OK", CancelButton: "Cancel"}) {
    const tc = dialog.open(DialogOKCancelComponent, {data: {Title: title, Text: text, Buttons: buttons}});
    tc.afterClosed().subscribe(result);
}

export async function showDialogInfo(dialog: MatDialog, title: string, text: string,
                                     dismiss: string,
                                     result: (result: boolean) => void = null) {
    const tc = dialog.open(DialogOKCancelComponent, {
        data: {
            Buttons: {OKButton: dismiss, CancelButton: ""},
            Text: text,
            Title: title,
        },
    });
    tc.afterClosed().subscribe((res) => {
        if (result) {
            result(res);
        }
    });
}

export async function storeCredential(dialog: MatDialog, title: string,
                                      store: () => Promise<void>) {
    return showTransactions(dialog, title, async (progress: TProgress) => {
        progress(50, "Storing Credential");
        await store();
    });
}

export type TProgress = (percentage: number, text: string) => void;
export type TWorker = (progress: TProgress) => Promise<void>;

export async function showTransactions(dialog: MatDialog, title: string, worker: TWorker): Promise<string> {
    const tc = dialog.open(DialogTransactionComponent, {
        data: {
            title,
            worker,
        },
        disableClose: true,
    });

    return new Promise((resolve) => {
        tc.afterClosed().subscribe((res) => {
            resolve(res);
        });
    });
}

export function hexBuffer(buf: Buffer, group: number = 16): string {
    let hex = buf.toString("hex");
    for (let pos = group; pos < hex.length; pos += group + 1) {
        hex = hex.substring(0, pos) + " " + hex.substring(pos);
    }
    return hex;
}

export interface IDialogOKCButtons {
    OKButton: string;
    CancelButton: string;
}

export interface IDialogOKCConfig {
    Title: string;
    Text: string;
    Buttons: IDialogOKCButtons;
}

@Component({
    selector: "app-dialog-okcancel",
    templateUrl: "dialog-okcancel.html",
})
export class DialogOKCancelComponent {
    constructor(
        public dialogRef: MatDialogRef<DialogOKCancelComponent>,
        @Inject(MAT_DIALOG_DATA) public data: IDialogOKCConfig) {
    }
}

export interface IDialogTransactionConfig {
    title: string;
    worker: TWorker;
}

@Component({
    selector: "app-dialog-transaction",
    styleUrls: ["./app-dialog-transaction.scss"],
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
    blocks: Element[] = [];
    transaction: Element;
    error: string;
    text: string;
    @ViewChild("main", {static: false}) main?: ElementRef;
    ubTimer: Timer;

    constructor(
        public dialogRef: MatDialogRef<DialogTransactionComponent>,
        public bcv: BcviewerService,
        private renderer: Renderer2,
        private el: ElementRef,
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
