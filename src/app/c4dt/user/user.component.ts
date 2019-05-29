import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatSnackBar } from "@angular/material";
import { Data, gData } from "../../../lib/Data";
import { showDialogInfo, showSnack } from "../../../lib/ui/Ui";
import { BcviewerService } from "../../bcviewer/bcviewer.component";

@Component({
    selector: "app-user",
    styleUrls: ["./user.component.css"],
    templateUrl: "./user.component.html",
})
export class UserComponent implements OnInit {
    contactForm: FormGroup;
    gData: Data;

    constructor(private snack: MatSnackBar,
                private dialog: MatDialog,
                private bcs: BcviewerService) {
        this.gData = gData;
    }

    ngOnInit() {
        this.updateContactForm();
    }

    updateContactForm() {
        this.contactForm = new FormGroup({
            alias: new FormControl(gData.contact.alias),
            email: new FormControl(gData.contact.email, Validators.email),
            subscribe: new FormControl(gData.contact.subscribe),
        });
    }

    login() {
        showDialogInfo(this.dialog, "Login to Service",
            "Chose from one of the following services to log in:<br>" +
            "<ul><li><a href='https://demo.c4dt.org/stainless?token=1234' target='_blank'>" +
            "Stainless Demonstrator</a></li>" +
            "<li><a href='https://demo.c4dt.org/safeai?token=1234' target='_blank'>SafeAI Demonstrator</a></li>" +
            "<li><a href='https://c4dt.org/restricted?token=1234' target='_blank'>Restricted C4DT Area</a></li></ul>",
            "Cancel");
    }

    async updateContact() {
        await showSnack(this.snack, "Updating User Data", async () => {
            gData.contact.alias = this.contactForm.controls.alias.value;
            gData.contact.email = this.contactForm.controls.email.value;
            gData.contact.subscribe = this.contactForm.controls.subscribe.value;
            await gData.contact.sendUpdate();
            this.bcs.updateBlocks();
        });
    }
}
