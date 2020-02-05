import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import { CalypsoReadInstance, CalypsoWriteInstance } from "@dedis/cothority/calypso";
import Darc from "@dedis/cothority/darc/darc";
import Log from "@dedis/cothority/log";

import { Contact, FileBlob, TProgress } from "@c4dt/dynacred";

import { showSnack, showTransactions } from "../../../lib/Ui";
import { UserData } from "../../user-data.service";
import { ManageDarcComponent } from "../manage-darc";

@Component({
    selector: "app-secure",
    templateUrl: "./secure.component.html",
})
export class SecureComponent implements OnInit {
    calypsoOurKeys: string[];
    calypsoOtherKeys: Map<Contact, FileBlob[]>;

    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private uData: UserData,
    ) {
        this.calypsoOtherKeys = new Map();
    }

    async ngOnInit() {
        Log.lvl3("init secure");
        await showSnack(this.snackBar, "Searching our secrets", async () => {
            await this.updateCalypso();
        });
    }

    /**
     * updateCalypso stores the keys and the FileBlobs in the class-variables so that the UI
     * can correctly show them.
     */
    async updateCalypso() {
        await this.uData.contact.calypso.fetchOurs(this.uData.lts);
        await this.uData.save();
        this.calypsoOurKeys = Array.from(this.uData.contact.calypso.ours.keys());
        Array.from(this.uData.contact.calypso.others.keys()).forEach((oid) => {
            const other = this.uData.contacts.find((c) => c.credentialIID.equals(oid));
            const fbs = Array.from(this.uData.contact.calypso.others.get(oid))
                .map((sd) => FileBlob.fromBuffer(sd.plainData));
            this.calypsoOtherKeys.set(other, fbs);
        });
    }

    async calypsoSearch(c: Contact) {
        await showTransactions(this.dialog, "Searching new secure data for " + c.alias.toLocaleUpperCase(),
            async (progress: TProgress) => {
                progress(30, "Reading secrets");
                await this.uData.contact.calypso.read(c);
                progress(60, "Storing Credential");
                await this.uData.save();
                progress(80, "Getting other secrets");
                await this.updateCalypso();
            });
    }

    async calypsoAccess(key: string) {
        Log.lvl3("change groups");
        const idWrite = await CalypsoWriteInstance.fromByzcoin(this.uData.bc,
            this.uData.contact.calypso.ours.get(key).writeInstID);
        const idDarc = await DarcInstance.fromByzcoin(this.uData.bc, idWrite.darcID);
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
                await showTransactions(this.dialog, "Updating Darc",
                    async (progress: TProgress) => {
                        progress(50, "Evolving DARC");
                        await idDarc.evolveDarcAndWait(result, [this.uData.keyIdentitySigner], 5);
                    });
            }
        });
    }

    async calypsoDelete(key: string) {
        await showTransactions(this.dialog, "Deleting secret",
            async (progress: TProgress) => {
                progress(30, "Removing key from access");
                await this.uData.contact.calypso.remove(key);
                progress(60, "Storing Credential");
                await this.uData.save();
                progress(80, "Fetching all secrets");
                await this.updateCalypso();
            });
    }

    async calypsoAddData() {
        const fileDialog = this.dialog.open(CalypsoUploadComponent, {
            width: "300px",
        });
        fileDialog.afterClosed().subscribe(async (result: File) => {
            if (result) {
                await showTransactions(this.dialog, "Storing data encrypted",
                    async (progress: TProgress) => {
                        const data = Buffer.from(await (await new Response((result).slice())).arrayBuffer());
                        const fb = new FileBlob(result.name, data, [{
                            name: "time",
                            value: result.lastModified.toString(),
                        }]);
                        progress(30, "Adding new Secret");
                        await this.uData.contact.calypso.add(fb.toBuffer());
                        progress(60, "Storing Credential");
                        await this.uData.save();
                        progress(80, "Updating secrets");
                        await this.updateCalypso();
                    });
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
