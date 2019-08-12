import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";

import { storeCredential } from "../../../lib/Ui";
import { BcviewerService } from "../../bcviewer/bcviewer.component";
import { UserData } from "../../user-data.service";

@Component({
    selector: "app-profile",
    styleUrls: ["./profile.component.css"],
    templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
    contactForm: FormGroup;

    constructor(private snack: MatSnackBar,
                private router: Router,
                private dialog: MatDialog,
                private bcs: BcviewerService,
                private uData: UserData) {
    }

    ngOnInit() {
        this.updateContactForm();
    }

    updateContactForm() {
        this.contactForm = new FormGroup({
            alias: new FormControl(this.uData.contact.alias),
            email: new FormControl(this.uData.contact.email, Validators.email),
            subscribe: new FormControl(this.uData.contact.subscribe),
        });
    }

    async updateContact() {
        this.uData.contact.alias = this.contactForm.controls.alias.value;
        this.uData.contact.email = this.contactForm.controls.email.value;
        this.uData.contact.subscribe = this.contactForm.controls.subscribe.value;
        await storeCredential(this.dialog, "Updating User Data", this.uData);
    }
}
