import {Component, OnInit} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";

import {storeCredential, storeUserCredential} from "../../../lib/Ui";
import {UserData} from "../../user-data.service";
import Log from "@dedis/cothority/log";
import {EAttributes} from "observable_dynacred";

@Component({
    selector: "app-profile",
    templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
    contactForm: FormGroup;

    constructor(private snack: MatSnackBar,
                private router: Router,
                private dialog: MatDialog,
                private uData: UserData) {
        this.contactForm = new FormGroup({
            alias: new FormControl("loading"),
            email: new FormControl("loading", Validators.email),
        });
    }

    ngOnInit() {
        this.uData.user.credential.aliasObservable().subscribe((alias) => {
            this.contactForm.patchValue({alias: alias});
        });
        this.uData.user.credential.emailObservable().subscribe((email) => {
            this.contactForm.patchValue({email: email});
        });
    }

    async updateContact() {
        await storeUserCredential(this.dialog, "Updating user User Data", this.uData,
            {
                name: EAttributes.alias,
                value: this.contactForm.controls.alias.value
            },
            {
                name: EAttributes.email,
                value: this.contactForm.controls.email.value
            });
    }
}
