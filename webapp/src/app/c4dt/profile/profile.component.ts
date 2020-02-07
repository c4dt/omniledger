import {Component, OnInit} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";

import {storeCredential, storeUserCredential} from "../../../lib/Ui";
import {BcviewerService} from "../../bcviewer/bcviewer.component";
import {UserData} from "../../user-data.service";
import {EAttributes} from "observable_dynacred/build/credentials";
import Log from "@dedis/cothority/log";

@Component({
    selector: "app-profile",
    templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
    contactForm: FormGroup;

    constructor(private snack: MatSnackBar,
                private router: Router,
                private dialog: MatDialog,
                private bcs: BcviewerService,
                private uData: UserData) {
        this.contactForm = new FormGroup({
            alias: new FormControl("loading"),
            email: new FormControl("loading", Validators.email),
        });
    }

    ngOnInit() {
        this.uData.user.credential.aliasObservable().subscribe((alias) => {
            Log.print("new alias", alias);
            this.contactForm.patchValue({alias: alias});
        });
        this.uData.user.credential.emailObservable().subscribe((email) => {
            Log.print("new email", email);
            this.contactForm.patchValue({email: email});
        });
    }

    async updateContact() {
        Log.print("uc");
        Log.print(this.uData);
        await storeUserCredential(this.dialog, "Updating user User Data", this.uData,
            {
                name: EAttributes.alias,
                value: this.contactForm.controls.alias.value
            },
            {
                name: EAttributes.email,
                value: this.contactForm.controls.email.value
            });
        // await storeCredential(this.dialog, "Updating User Data", this.uData);
    }
}
