import { Component, OnInit } from "@angular/core";

import Log from "@dedis/cothority/log";
import { UserData } from "../../user-data.service";

@Component({
    selector: "app-welcome",
    templateUrl: "./welcome.component.html",
})
export class WelcomeComponent {
    name: string;

    constructor(private uData: UserData) {
        uData.user.credential.aliasObservable().subscribe((alias) => {
            this.name = alias;
        });
    }
}
