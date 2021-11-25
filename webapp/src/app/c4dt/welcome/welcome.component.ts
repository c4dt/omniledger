import { Component, OnInit } from "@angular/core";

import { UserService } from "src/app/user.service";
import { ByzCoinService } from "src/app/byz-coin.service";
import { Darc, IdentityWrapper } from "@dedis/cothority/darc";
import { Action, ConfigService } from "src/app/api/v0/cas/config.service";

@Component({
    selector: "app-welcome",
    templateUrl: "./welcome.component.html",
})
export class WelcomeComponent implements OnInit {
    name: string;
    matrixAccess = false;
    c4dtAccess = false;

    constructor(private user: UserService,
                private builder: ByzCoinService,
                private configService: ConfigService,
    ) {
        user.credStructBS.credPublic.alias.subscribe((alias) => {
            this.name = alias;
        });
    }

    async ngOnInit(): Promise<void> {
        const config = await this.configService.config;
        this.c4dtAccess = await this.checkService(config.serviceToAction.get("https://www.c4dt.org/"));
        this.matrixAccess = await this.checkService(config.serviceToAction.get("https://matrix.c4dt.org/"));
    }

    private async checkService(action: Action | undefined): Promise<boolean> {
        if (action !== undefined) {
            const rules = await this.builder.bc.checkAuthorization(
                this.builder.bc.genesisID, action.darc,
                IdentityWrapper.fromIdentity(this.user.kiSigner));
            return rules.indexOf(Darc.ruleSign) !== -1;
        }
        return false;
    }
}
