import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

import { EAttributesPublic, ECredentials } from "dynacred";
import { UserService } from "src/app/user.service";
import { storeUserCredential } from "../../../lib/Ui";

@Component({
    selector: "app-profile",
    templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
    contactForm: FormGroup;

    constructor(private snack: MatSnackBar,
                private router: Router,
                private dialog: MatDialog,
                private user: UserService) {
        this.contactForm = new FormGroup({
            alias: new FormControl("loading"),
            email: new FormControl("loading", Validators.email),
        });
    }

    ngOnInit() {
        this.user.credStructBS.credPublic.alias.subscribe((alias) => {
            this.contactForm.patchValue({alias});
        });
        this.user.credStructBS.credPublic.email.subscribe((email) => {
            this.contactForm.patchValue({email});
        });
    }

    async updateContact() {
        await storeUserCredential(this.dialog, "Updating user User Data", this.user,
            {
                attr: EAttributesPublic.alias,
                cred: ECredentials.pub,
                value: this.contactForm.controls.alias.value,
            },
            {
                attr: EAttributesPublic.email,
                cred: ECredentials.pub,
                value: this.contactForm.controls.email.value,
            },
        );
    }
}
