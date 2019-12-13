import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { Contact } from "@c4dt/dynacred";

import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import { IdentityDarc } from "@dedis/cothority/darc";

@Component({
    selector: "app-contact-info",
    styles: [
        ".waiting { opacity: 0.5; }",
        ".undefined { opacity: 0.5; }",
    ],
    templateUrl: "./contact-info.component.html",
})
export class ContactInfoComponent implements OnInit {
    signerInstanceID: IdentityDarc | undefined;
    contacts: Contact[] | undefined;
    actions: DarcInstance[] | undefined;
    groups: DarcInstance[] | undefined;

    constructor(
        public dialogRef: MatDialogRef<ContactInfoComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: { contact: Contact }) {}

    async ngOnInit() {
        this.data.contact.getContacts().then(() => this.contacts = this.data.contact.contacts);
        this.data.contact.getDarcSignIdentity().then((id) => this.signerInstanceID = id);
        this.data.contact.getActions().then((actions) => this.actions = actions);
        this.data.contact.getGroups().then((groups) => this.groups = groups);
    }
}
