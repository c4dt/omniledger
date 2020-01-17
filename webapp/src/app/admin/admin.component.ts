import { Component } from "@angular/core";

import Log from "@c4dt/cothority/log";

@Component({
    selector: "app-user",
    templateUrl: "./admin.component.html",
})
export class AdminComponent {
    constructor() {
        Log.lvl1("Starting admin");
    }
}
