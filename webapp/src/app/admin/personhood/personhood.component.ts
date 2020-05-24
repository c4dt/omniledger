import { Component } from "@angular/core";
import { UserService } from "src/app/user.service";

@Component({
    selector: "app-personhood",
    templateUrl: "./personhood.component.html",
})
export class PersonhoodComponent {

    constructor(public user: UserService) {
    }

}
