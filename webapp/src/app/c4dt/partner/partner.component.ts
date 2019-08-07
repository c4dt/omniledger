import { Location } from "@angular/common";
import { Component } from "@angular/core";
import { MatDialog, MatSnackBar } from "@angular/material";
import { showDialogInfo } from "../../../lib/Ui";
import { ContactsComponent } from "../../admin/contacts/contacts.component";
import { BcviewerService } from "../../bcviewer/bcviewer.component";
import { UserData } from "../../user-data.service";

@Component({
    selector: "app-partner",
    styleUrls: ["./partner.component.css"],
    templateUrl: "./partner.component.html",
})
export class PartnerComponent extends ContactsComponent {

    constructor(dialog: MatDialog,
                snackBar: MatSnackBar,
                bcvs: BcviewerService,
                location: Location,
                uData: UserData,
    ) {
        super(dialog, snackBar, bcvs, location, uData);
    }

    async createSimpleContact() {
        const groups = await this.uData.contact.getGroups();
        if (groups.length === 0) {
            return showDialogInfo(this.dialog, "No Group Found", "There are no groups tied to your account.\n" +
                "Wait some seconds and try again.", "Understood");
        }
        await super.createContact("c4dt_user", [groups[0].darc.description.toString()]);
    }
}
