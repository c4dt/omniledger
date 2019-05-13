import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar } from "@angular/material";
import DarcInstance from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import { CalypsoReadInstance } from "@c4dt/cothority/calypso";
import { CalypsoWriteInstance } from "@c4dt/cothority/calypso";
import Darc from "@c4dt/cothority/darc/darc";
import { Log } from "@c4dt/cothority/log";
import { Contact } from "../../../lib/Contact";
import { gData } from "../../../lib/Data";
import { FileBlob, SecureData } from "../../../lib/SecureData";
import { showSnack } from "../../../lib/ui/Ui";
import { ManageDarcComponent } from "../manage-darc";

@Component({
    selector: "app-secure",
    styleUrls: ["./secure.component.css"],
    templateUrl: "./secure.component.html",
})
export class SecureComponent implements OnInit {
    calypsoOurKeys: string[];
    calypsoOtherKeys: Map<Contact, FileBlob[]>;

    constructor(public dialog: MatDialog,
                private snackBar: MatSnackBar) {
        this.calypsoOtherKeys = new Map();
    }

    ngOnInit() {
        Log.lvl3("init secure");
        this.updateCalypso();
    }

    /**
     * updateCalypso stores the keys and the FileBlobs in the class-variables so that the UI
     * can correctly show them.
     */
    updateCalypso() {
        this.calypsoOurKeys = Array.from(gData.contact.calypso.ours.keys());
        Array.from(gData.contact.calypso.others.keys()).forEach((oid) => {
            const other = gData.contacts.find((c) => c.credentialIID.equals(oid));
            const fbs = Array.from(gData.contact.calypso.others.get(oid))
                .map((sd) => FileBlob.fromBuffer(sd.plainData));
            this.calypsoOtherKeys.set(other, fbs);
        });
    }

    async calypsoSearch(c: Contact) {
        await showSnack(this.snackBar, "Searching new secure data for " + c.alias.toLocaleUpperCase(), async () => {
            await gData.contact.calypso.read(c);
            await gData.save();
            this.updateCalypso();
        });
    }

    async calypsoAccess(key: string) {
        Log.lvl3("change groups");
        const idWrite = await CalypsoWriteInstance.fromByzcoin(gData.bc,
            gData.contact.calypso.ours.get(key).writeInstID);
        const idDarc = await DarcInstance.fromByzcoin(gData.bc, idWrite.darcID);
        const tc = this.dialog.open(ManageDarcComponent,
            {
                data: {
                    darc: idDarc.darc,
                    filter: "action",
                    rule: "spawn:" + CalypsoReadInstance.contractID,
                    title: "test",
                },
                height: "400px",
                width: "400px",
            });
        tc.afterClosed().subscribe(async (result: Darc) => {
            if (result) {
                await showSnack(this.snackBar, "Updating Darc", async () => {
                    await idDarc.evolveDarcAndWait(result, [gData.keyIdentitySigner], 5);
                });
            }
        });
    }

    async calypsoDelete(key: string) {
        await gData.contact.calypso.remove(key);
        await gData.save();
        this.updateCalypso();
    }

    async calypsoAddData() {
        const fileDialog = this.dialog.open(CalypsoUploadComponent, {
            width: "300px",
        });
        fileDialog.afterClosed().subscribe(async (result: File) => {
            if (result) {
                const data = Buffer.from(await (await new Response((result).slice())).arrayBuffer());
                const fb = new FileBlob(result.name, data, [{name: "time", value: result.lastModified.toString()}]);
                await gData.contact.calypso.add(fb.toBuffer());
                await gData.save();
                this.updateCalypso();
            } else {
                Log.lvl1("Didnt get any data");
            }
        });
    }

    async calypsoDownload(c: Contact, fb: FileBlob) {
        const a = document.createElement("a");
        const file: any = new Blob([fb.data], {
            type: "application/octet-stream",
        });
        a.href = window.URL.createObjectURL(file);
        a.target = "_blank";
        a.download = fb.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async calypsoShowAccess(key: string) {
        this.dialog.open(CalypsoShowAccessComponent, {
            data: key,
            width: "300px",
        });
    }
}

@Component({
    selector: "app-calypso-upload",
    templateUrl: "calypso-upload.html",
})
export class CalypsoUploadComponent {
    file: File;

    constructor(
        public dialogRef: MatDialogRef<CalypsoUploadComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Buffer) {
    }

    cancel(): void {
        this.dialogRef.close();
    }

    async handleFileInput(e: Event) {
        this.file = (e.target as any).files[0] as File;
    }
}

@Component({
    selector: "app-calypso-show-access",
    templateUrl: "calypso-show-access.html",
})
export class CalypsoShowAccessComponent {
    constructor(
        public dialogRef: MatDialogRef<CalypsoShowAccessComponent>,
        @Inject(MAT_DIALOG_DATA) public data: string) {
    }

    ok(): void {
        this.dialogRef.close();
    }
}
