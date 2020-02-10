import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

import { Data } from "@c4dt/dynacred";

import {showSnack, storeCredential, storeUserCredential} from "../../../lib/Ui";
import { UserData } from "../../user-data.service";
import {EAttributes} from "observable_dynacred";

@Component({
    selector: "app-yourself",
    templateUrl: "./yourself.component.html",
})
export class YourselfComponent implements OnInit {
    contactForm: FormGroup;
    views = Data.views;
    coins = "loading";

    constructor(private snack: MatSnackBar,
                private dialog: MatDialog,
                public uData: UserData) {
    }

    async ngOnInit() {
        this.contactForm = new FormGroup({
            alias: new FormControl("loading"),
            email: new FormControl("loading", Validators.email),
            phone: new FormControl("loading"),
            view: new FormControl("loading"),
        });
        const c = this.uData.user.credential;
        c.aliasObservable().subscribe((alias) =>
            this.contactForm.patchValue({alias}));
        c.emailObservable().subscribe((email) =>
            this.contactForm.patchValue({email}));
        c.phoneObservable().subscribe((phone) =>
            this.contactForm.patchValue({phone}));
        c.stringObservable(EAttributes.view).subscribe((view) =>
            this.contactForm.patchValue({view}));
        (await c.coinObservable()).subscribe((coin) =>
            this.coins = coin.value.toString()
        )

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
            },
            {
                name: EAttributes.phone,
                value: this.contactForm.controls.phone.value
            }
            );
    }
}
