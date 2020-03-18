import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import {storeUserCredential, UIViews} from "../../../lib/Ui";
import {
    EAttributesConfig,
    EAttributesPublic,
    ECredentials
} from "dynacred2";
import {UserService} from "src/app/user.service";

@Component({
    selector: "app-yourself",
    templateUrl: "./yourself.component.html",
})
export class YourselfComponent implements OnInit {
    contactForm: FormGroup;
    views = UIViews;
    coins = "loading";

    constructor(private snack: MatSnackBar,
                private dialog: MatDialog,
                public user: UserService) {
    }

    async ngOnInit() {
        this.contactForm = new FormGroup({
            alias: new FormControl("loading"),
            email: new FormControl("loading", Validators.email),
            phone: new FormControl("loading"),
            view: new FormControl("loading"),
        });
        const pub = this.user.credStructBS.credPublic;
        const conf = this.user.credStructBS.credConfig;
        pub.alias.subscribe((alias) =>
            this.contactForm.patchValue({alias}));
        pub.email.subscribe((email) =>
            this.contactForm.patchValue({email}));
        pub.phone.subscribe((phone) =>
            this.contactForm.patchValue({phone}));
        conf.view.subscribe((view) =>
            this.contactForm.patchValue({view}));
        this.user.coinBS.subscribe((coin) =>
            this.coins = coin.value.toString()
        )

    }

    async updateContact() {
        await storeUserCredential(this.dialog, "Updating user User Data", this.user,
            {
                cred: ECredentials.pub,
                attr: EAttributesPublic.alias,
                value: this.contactForm.controls.alias.value
            },
            {
                cred: ECredentials.pub,
                attr: EAttributesPublic.email,
                value: this.contactForm.controls.email.value
            },
            {
                cred: ECredentials.pub,
                attr: EAttributesPublic.phone,
                value: this.contactForm.controls.phone.value
            },
            {
                cred: ECredentials.config,
                attr: EAttributesConfig.view,
                value: this.contactForm.controls.view.value
            }
            );
    }
}
