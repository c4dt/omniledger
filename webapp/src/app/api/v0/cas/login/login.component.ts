import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";

import Log from "@dedis/cothority/log";

@Component({
    selector: "app-login",
    styleUrls: ["./login.component.css"],
    templateUrl: "./login.component.html",
})
export class LoginComponent {
    server: string;
    private service: string;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
    ) {
        if (gData.contact.isRegistered()) {
            this.service = decodeURI(route.snapshot.queryParamMap.get("service"));
            Log.print(this.service);
            this.server = this.service.replace(/^https*:\/\/(.*?)\/.*/, "$1");
        } else {
            router.navigateByUrl(Defaults.PathUser);
        }
    }

    login() {
        window.location.href = this.service + "&ticket=ol-" +
            gData.contact.credentialIID.slice(0, 8).toString("hex");
    }

    async deny() {
        await this.router.navigateByUrl(Defaults.PathUser);
    }

}
