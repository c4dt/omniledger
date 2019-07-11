import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatSnackBar } from "@angular/material";
import { Router } from "@angular/router";

import { Data, gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";

import { showSnack } from "../../../lib/Ui";
import { BcviewerService } from "../../bcviewer/bcviewer.component";

@Component({
    selector: "app-yourself",
    styleUrls: ["./yourself.component.css"],
    templateUrl: "./yourself.component.html",
})
export class YourselfComponent implements OnInit {
    gData: Data;
    contactForm: FormGroup;
    views = Data.views;

    constructor(private snack: MatSnackBar,
                private dialog: MatDialog,
                private router: Router,
                private bcs: BcviewerService) {
        this.gData = gData;
    }

    async ngOnInit() {
        this.updateContactForm();
    }

    updateContactForm() {
        this.contactForm = new FormGroup({
            alias: new FormControl(gData.contact.alias),
            email: new FormControl(gData.contact.email, Validators.email),
            phone: new FormControl(gData.contact.phone),
            view: new FormControl(gData.contact.view),
        });
    }

    async updateCoins() {
        await showSnack(this.snack, "Updating coins", async () => {
            await gData.coinInstance.update();
        });
    }

    async updateContact() {
        await showSnack(this.snack, "Updating User Data", async () => {
            gData.contact.alias = this.contactForm.controls.alias.value;
            gData.contact.email = this.contactForm.controls.email.value;
            gData.contact.phone = this.contactForm.controls.phone.value;
            gData.contact.view = this.contactForm.controls.view.value;
            await gData.contact.sendUpdate();
            this.bcs.updateBlocks();
            await this.router.navigateByUrl(Defaults.PathUser);
        });
    }
}
