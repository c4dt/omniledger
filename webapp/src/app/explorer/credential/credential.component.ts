import { Component, Input, OnInit } from "@angular/core";
import DarcInstance from "@c4dt/cothority/byzcoin/contracts/darc-instance";
import { IdentityDarc } from "@c4dt/cothority/darc";
import { Contact } from "@c4dt/dynacred";

@Component({
    selector: "app-credential",
    styles: [
        ".waiting { opacity: 0.5; }",
        ".undefined { opacity: 0.5; }",
    ],
    templateUrl: "./credential.component.html",
})
export class CredentialComponent implements OnInit {

    @Input()
    contact: Contact;

    signerInstanceID: IdentityDarc | undefined;
    contacts: Contact[] | undefined;
    actions: DarcInstance[] | undefined;
    groups: DarcInstance[] | undefined;

    async ngOnInit() {
        this.contact.getContacts().then(() => this.contacts = this.contact.contacts);
        this.contact.getDarcSignIdentity().then((id) => this.signerInstanceID = id);
        this.contact.getActions().then((actions) => this.actions = actions);
        this.contact.getGroups().then((groups) => this.groups = groups);
    }
}
