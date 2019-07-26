import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { InstanceID } from "@dedis/cothority/byzcoin";
import { IdentityWrapper } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";

import { UserData } from "../../../../user-data.service";

@Component({
    selector: "app-login",
    styleUrls: ["./login.component.css"],
    templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {
    failed: string;
    darcID: InstanceID;
    challenge: InstanceID;
    redirect: string;

    constructor(
        private route: ActivatedRoute,
        private uData: UserData,
    ) {
    }

    async getParam(p: string, s: number): Promise<Buffer> {
        const param = this.route.snapshot.queryParamMap.get(p);
        if (!param || param.length !== s) {
            Log.print("invalid", p, param);
            return Promise.reject(p + ": not a valid param");
        }
        return Buffer.from(param, "hex");
    }

    async ngOnInit() {
        try {
            this.redirect = this.route.snapshot.queryParamMap.get("redirect");
            this.darcID = await this.getParam("darcid", 64);
            this.challenge = await this.getParam("challenge", 40);
        } catch (e) {
            this.failed = e;
            return;
        }

        let loginOK = false;
        try {
            const ident = IdentityWrapper.fromIdentity(this.uData.keyIdentitySigner);
            const reply = await this.uData.bc.checkAuthorization(this.uData.bc.genesisID, this.darcID, ident);
            if (!reply || reply.length === 0) {
                this.failed = "You're not allowed to login";
            } else {
                loginOK = true;
            }
        } catch (e) {
            Log.error("Couldn't check authorization:", e);
            this.failed = e;
        }
        window.open(this.redirect + "?login=" + loginOK, "_self");
    }
}
