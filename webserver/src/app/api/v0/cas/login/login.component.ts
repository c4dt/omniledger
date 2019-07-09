import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import Log from "@dedis/cothority/log";

import { gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";

@Component({
    selector: "app-login",
    styleUrls: ["./login.component.css"],
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
    server: string;
    private service: string;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
    ) {
    }

    async ngOnInit() {
        try {
            Log.print("loading");
            await gData.load();
            Log.print("loaded");
            if (gData.contact.isRegistered()) {
                this.service = decodeURI(this.route.snapshot.queryParamMap.get("service"));
                Log.print(this.service);
                this.server = this.service.replace(/^https*:\/\/(.*?)\/.*/, "$1");
            } else {
                await this.router.navigateByUrl(Defaults.PathNew);
            }
        } catch (e) {
            Log.catch(e);
            throw new Error(e);
        }
    }

    login() {
        window.location.href = this.service + "&ticket=ol-" +
            gData.contact.credentialIID.slice(0, 8).toString("hex");
    }

    deny() {
        this.router.navigateByUrl("/c4dt");
    }

}
