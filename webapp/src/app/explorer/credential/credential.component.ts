import { Component, Input, OnInit } from "@angular/core";
import { AddressBook, CredentialConfig, CredentialPublic, CredentialStructBS } from "dynacred";
import { ByzCoinService } from "src/app/byz-coin.service";

@Component({
    selector: "app-credential",
    styles: [
        ".waiting { opacity: 0.5; }",
        ".undefined { opacity: 0.5; }",
    ],
    templateUrl: "./credential.component.html",
})
export class CredentialComponent implements OnInit {

    @Input()
    credStruct: CredentialStructBS;

    pub: CredentialPublic;
    config: CredentialConfig;
    addressBook: AddressBook;

    constructor(public bcs: ByzCoinService) {
    }

    async ngOnInit() {
        this.pub = this.credStruct.credPublic;
        this.config = this.credStruct.credConfig;
        this.addressBook = await this.bcs.retrieveAddressBook(this.pub);
    }
}
