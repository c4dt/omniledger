import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import {
    AddressBook,
    CredentialConfig,
    CredentialPublic,
    CredentialSignerBS,
    CredentialStructBS,
} from "dynacred";
import { BehaviorSubject } from "rxjs";
import { ByzCoinService } from "src/app/byz-coin.service";

@Component({
    selector: "app-contact-info",
    styles: [
        ".waiting { opacity: 0.5; }",
        ".undefined { opacity: 0.5; }",
    ],
    templateUrl: "./contact-info.component.html",
})
export class ContactInfoComponent implements OnInit {
    signerBS: CredentialSignerBS | undefined;
    pub: CredentialPublic;
    config: CredentialConfig;
    addressBook: AddressBook | undefined;
    recoveries = new BehaviorSubject(["none"]);

    constructor(
        public dialogRef: MatDialogRef<ContactInfoComponent>,
        private builder: ByzCoinService,
        @Inject(MAT_DIALOG_DATA) readonly data: { contact: CredentialStructBS }) {}

    async ngOnInit() {
        this.pub = this.data.contact.credPublic;
        this.config = this.data.contact.credConfig;
        this.signerBS = await this.builder.retrieveCredentialSignerBS(this.data.contact);
        this.addressBook = await this.builder.retrieveAddressBook(this.pub);
        this.signerBS.recoveries.subscribe((dbs) => {
            this.recoveries.next(dbs.map((d) => d.getValue().description.toString()));
        });
    }
}
