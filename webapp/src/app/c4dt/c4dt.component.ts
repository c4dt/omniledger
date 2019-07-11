import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material";
import { Router } from "@angular/router";

import Log from "@dedis/cothority/log";

import { gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";

import { RetryLoadComponent } from "../admin/admin.component";
import { BcviewerService } from "../bcviewer/bcviewer.component";

@Component({
    selector: "app-c4dt",
    styleUrls: ["./c4dt.component.css"],
    templateUrl: "./c4dt.component.html",
})
export class C4dtComponent implements OnInit {
    isLoaded = false;
    isNew = false;
    isPartner = false;
    showDevices = false;

    constructor(private dialog: MatDialog,
                private router: Router,
                private bcs: BcviewerService) {
    }

    navigateToSubtab() {
        Log.print("pathname is", window.location.pathname);
        let path = "/c4dt/";
        switch (gData.contact.view) {
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
        this.isLoaded = true;
        this.bcs.updateBlocks();

        Log.lvl1("navigating to", path, "because of", gData.contact.view);
        if (window.location.pathname.match(/\/c4dt$/)) {
            return this.router.navigateByUrl(path);
        }
    }

    async ngOnInit() {
        Log.lvl3("init c4dt");
        if (gData.contact && gData.contact.isRegistered() && gData.coinInstance) {
            Log.lvl1("user is registered");
            await this.navigateToSubtab();
        } else {
            try {
                await gData.load();
                Log.lvl1("loading user");
                if (gData.contact.isRegistered()) {
                    Log.lvl1("user is registered after load");
                    await this.navigateToSubtab();
                } else {
                    Log.lvl1("user is not registered after load");
                    await this.router.navigateByUrl(Defaults.PathNew);
                }
            } catch (e) {
                Log.lvl1("error while loading");
                if (!gData.constructorObj) {
                    this.isNew = true;
                    await this.router.navigateByUrl("/c4dt/newuser");
                } else {
                    const fileDialog = this.dialog.open(RetryLoadComponent, {
                        width: "300px",
                    });
                    fileDialog.afterClosed().subscribe(async (result: boolean) => {
                        if (result) {
                            window.location.reload();
                        } else {
                            await this.router.navigateByUrl(Defaults.PathNew);
                        }
                    });
                }
            }
        }
    }
}
