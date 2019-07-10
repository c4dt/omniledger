import { Location } from "@angular/common";
import { Component } from "@angular/core";
import { MatDialog, MatSnackBar } from "@angular/material";
import { ContactsComponent } from "../../admin/contacts/contacts.component";
import { BcviewerService } from "../../bcviewer/bcviewer.component";

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
    ) {
        super(dialog, snackBar, bcvs, location);
    }

    async ngOnInit() {
        super.ngOnInit();
    }
}
