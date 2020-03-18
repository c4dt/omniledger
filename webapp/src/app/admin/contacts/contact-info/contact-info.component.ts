import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import {
    AddressBook,
    CredentialConfig,
    CredentialPublic,
    CredentialSignerBS,
    CredentialStructBS
} from "dynacred2";

import {UserService} from "src/app/user.service";

@Component({
    selector: "app-contact-info",
    styles: [
        ".waiting { opacity: 0.5; }",
        ".undefined { opacity: 0.5; }",
    ],
    templateUrl: "./contact-info.component.html",
})
export class ContactInfoComponent implements OnInit {
    public signerBS: CredentialSignerBS | undefined;
    public pub: CredentialPublic;
    public config: CredentialConfig;
    public addressBook: AddressBook | undefined;

    constructor(
        public dialogRef: MatDialogRef<ContactInfoComponent>,
        public user: UserService,
        @Inject(MAT_DIALOG_DATA) readonly data: { contact: CredentialStructBS }) {}

    async ngOnInit() {
        this.pub = this.data.contact.credPublic;
        this.config = this.data.contact.credConfig;
        this.signerBS = await this.user.retrieveCredentialSignerBS(this.data.contact);
        this.addressBook = await this.user.retrieveAddressBook(this.pub);
    }
}
