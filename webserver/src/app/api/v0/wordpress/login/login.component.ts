import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";
import { InstanceID } from "@dedis/cothority/byzcoin";
import { IdentityWrapper } from "@dedis/cothority/darc";
import Log from "@dedis/cothority/log";

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

        const d = await gData.load();

        let loginOK = false;
        try {
            const signer = d.contact.darcInstance.getSignerDarcIDs()[0];
            const ident = IdentityWrapper.fromIdentity(d.keyIdentitySigner);
            const reply = await d.bc.checkAuthorization(Defaults.ByzCoinID, signer, ident);
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
