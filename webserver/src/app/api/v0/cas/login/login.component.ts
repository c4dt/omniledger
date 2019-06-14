import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import Log from "@dedis/cothority/log";
import { gData } from "../../../../../lib/Data";

@Component({
    selector: "app-login",
    styleUrls: ["./login.component.css"],
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
    private service: string;
    private server: string;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
    ) {
        if (gData.contact.isRegistered()) {
            this.service = decodeURI(route.snapshot.queryParamMap.get("service"));
            Log.print(this.service);
            this.server = this.service.replace(/^https*:\/\/(.*?)\/.*/, "$1");
        } else {
            router.navigateByUrl("/c4dt/newuser");
        }
    }

    ngOnInit() {
    }

    login() {
        window.location.href = this.service + "&ticket=ol-" +
            gData.contact.credentialIID.slice(0, 8).toString("hex");
    }

    deny() {
        this.router.navigateByUrl("/c4dt");
    }

}
