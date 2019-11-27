import { Component } from "@angular/core";

import { showDialogInfo } from "../../../lib/Ui";
import { ContactsComponent } from "../../admin/contacts/contacts.component";

@Component({
    selector: "app-partner",
    templateUrl: "./partner.component.html",
})
export class PartnerComponent extends ContactsComponent {
    async createSimpleContact() {
        const groups = await this.uData.contact.getGroups();
        if (groups.length === 0) {
            return showDialogInfo(this.dialog, "No Group Found", "There are no groups tied to your account.\n" +
                "Wait some seconds and try again.", "Understood");
        }
        await super.createContact("c4dt_user", [groups[0].darc.description.toString()]);
    }
}
