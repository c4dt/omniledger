import { Component, OnInit } from "@angular/core";
import Log from "@dedis/cothority/log";
import { UserData } from "../../user-data.service";

@Component({
    selector: "app-personhood",
    templateUrl: "./personhood.component.html",
})
export class PersonhoodComponent {

    constructor(public uData: UserData) {
    }

}
