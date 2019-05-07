import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Data, gData } from "../../../lib/Data";

@Component({
  selector: "app-yourself",
  styleUrls: ["./yourself.component.css"],
  templateUrl: "./yourself.component.html",
})
export class YourselfComponent implements OnInit {
  gData: Data;
  contactForm: FormGroup;

  constructor() {
    this.gData = gData;
  }

  ngOnInit() {
    this.updateContactForm();
  }

  updateContactForm() {
    this.contactForm = new FormGroup({
      alias: new FormControl(gData.contact.alias),
      email: new FormControl(gData.contact.email, Validators.email),
      phone: new FormControl(gData.contact.phone),
    });
  }

  async updateContact() {
    gData.contact.alias = this.contactForm.controls.alias.value;
    gData.contact.email = this.contactForm.controls.email.value;
    gData.contact.phone = this.contactForm.controls.phone.value;
    await gData.contact.sendUpdate();
  }
}
