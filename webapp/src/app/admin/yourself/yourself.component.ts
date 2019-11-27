import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";

import { Data } from "@c4dt/dynacred";

import { showSnack, storeCredential } from "../../../lib/Ui";
import { BcviewerService } from "../../bcviewer/bcviewer.component";
import { UserData } from "../../user-data.service";

@Component({
    selector: "app-yourself",
    templateUrl: "./yourself.component.html",
})
export class YourselfComponent implements OnInit {
    contactForm: FormGroup;
    views = Data.views;

    constructor(private snack: MatSnackBar,
                private dialog: MatDialog,
                private router: Router,
                private bcs: BcviewerService,
                public uData: UserData) {
    }

    async ngOnInit() {
        this.updateContactForm();
    }

    updateContactForm() {
        this.contactForm = new FormGroup({
            alias: new FormControl(this.uData.contact.alias),
            email: new FormControl(this.uData.contact.email, Validators.email),
            phone: new FormControl(this.uData.contact.phone),
            view: new FormControl(this.uData.contact.view),
        });
    }

    async updateCoins() {
        await showSnack(this.snack, "Updating coins", async () => {
            await this.uData.coinInstance.update();
        });
    }

    async updateContact() {
        this.uData.contact.alias = this.contactForm.controls.alias.value;
        this.uData.contact.email = this.contactForm.controls.email.value;
        this.uData.contact.phone = this.contactForm.controls.phone.value;
        this.uData.contact.view = this.contactForm.controls.view.value;
        await storeCredential(this.dialog, "Updating User Data", this.uData);
    }
}
