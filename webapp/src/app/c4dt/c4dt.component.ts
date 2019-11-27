import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";

import Log from "@dedis/cothority/log";
import { UserData } from "../user-data.service";

@Component({
    selector: "app-c4dt",
    templateUrl: "./c4dt.component.html",
})
export class C4dtComponent implements OnInit {
    isPartner = false;
    showDevices = false;

    constructor(private dialog: MatDialog,
                private router: Router,
                private uData: UserData) {
    }

    async ngOnInit() {
        Log.lvl1("pathname is", window.location.pathname);
        let path = "/c4dt/";
        switch (this.uData.contact.view) {
            case "c4dt_admin":
            case "c4dt_partner":
                this.isPartner = true;
                this.showDevices = true;
            case "c4dt_user":
                path += "welcome";
                break;
            default:
                path = "/admin";
        }

        Log.lvl1("navigating to", path, "because of", this.uData.contact.view);
        if (window.location.pathname.match(/\/c4dt$/)) {
            return this.router.navigateByUrl(path);
        }
    }
}
