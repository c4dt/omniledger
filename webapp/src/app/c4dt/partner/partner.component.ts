import { Component } from "@angular/core";

import { showDialogInfo } from "../../../lib/Ui";
import { ContactInfoComponent, ContactsComponent } from "../../admin/contacts/contacts.component";
import { CredentialStructBS } from "dynacred";

@Component({
    selector: "app-partner",
    templateUrl: "./partner.component.html",
})
export class PartnerComponent extends ContactsComponent {
    async createSimpleContact() {
        const groups = this.user.addressBook.groups.getValue();
        if (groups.length === 0) {
            return showDialogInfo(this.dialog, "No Group Found", "There are no groups tied to your account.",
                "Understood");
        }
        await super.contactNew("c4dt_user", groups.map((g) => g.getValue().description.toString()));
    }

    async contactShow(contact: CredentialStructBS) {
        this.dialog.open(ContactInfoComponent, {data: {contact}});
    }
}
