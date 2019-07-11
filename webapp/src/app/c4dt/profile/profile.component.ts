import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";

import { Data, gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";

import { showDialogInfo, showSnack } from "../../../lib/Ui";
import { BcviewerService } from "../../bcviewer/bcviewer.component";

@Component({
    selector: "app-profile",
    styleUrls: ["./profile.component.css"],
    templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
    contactForm: FormGroup;
    gData: Data;

    constructor(private snack: MatSnackBar,
                private router: Router,
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
