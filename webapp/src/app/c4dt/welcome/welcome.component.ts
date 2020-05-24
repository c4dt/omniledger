import { Component } from "@angular/core";

import { UserService } from "src/app/user.service";

@Component({
    selector: "app-welcome",
    templateUrl: "./welcome.component.html",
})
export class WelcomeComponent {
    name: string;

    constructor(private user: UserService) {
        user.credStructBS.credPublic.alias.subscribe((alias) => {
            this.name = alias;
        });
    }
}
