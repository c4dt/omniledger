import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatSnackBar } from "@angular/material";
import { Data, gData } from "@c4dt/dynacred/Data";
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
    views: string[];

    constructor(private snack: MatSnackBar,
                private dialog: MatDialog,
                private bcs: BcviewerService) {
        this.gData = gData;
        this.views = ["default", "c4dt_admin", "c4dt_partner", "c4dt_user"];
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
        });
    }
}
