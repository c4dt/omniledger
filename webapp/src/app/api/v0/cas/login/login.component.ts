import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";

import { Darc, IdentityWrapper } from "src/lib/cothority/darc";

import { showDialogInfo } from "../../../../../lib/Ui";
import { UserData } from "../../../../user-data.service";

@Component({
    selector: "app-login",
    styleUrls: ["./login.component.css"],
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
    static readonly casLoginDarc =
        Buffer.from("b7240d7e4bcc33b4a2af5d2110c512f3118478b964f2b4be9f99b27853702489", "hex");
    server: string;
    authorized = false;
    private service: string;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dialog: MatDialog,
        private uData: UserData,
    ) {
    }

    async ngOnInit() {
        this.service = decodeURI(this.route.snapshot.queryParamMap.get("service"));
        this.server = this.service.replace(/^https*:\/\/(.*?)\/.*/, "$1");
        const auths = await this.uData.bc.checkAuthorization(this.uData.bc.genesisID,
            LoginComponent.casLoginDarc,
            IdentityWrapper.fromIdentity(this.uData.keyIdentitySigner));
        if (auths.indexOf(Darc.ruleSign) >= 0) {
            this.authorized = true;
        } else {
            await showDialogInfo(this.dialog, "No access", "Sorry, you don't have access to " +
                `${this.service}...`, "Understood");
        }
    }

    async login() {
        window.location.href = this.service + "&ticket=ol-" +
            this.uData.contact.credentialIID.slice(0, 8).toString("hex");
        window.location.href = this.service + "&ticket=ol-" +
            this.uData.contact.credentialIID.slice(0, 8).toString("hex");
    }

    async deny() {
        await this.router.navigate(["/"]);
    }

}
