import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import CredentialsInstance from "@dedis/cothority/personhood/credentials-instance";
import { CredentialStructBS } from "dynacred";
import { ByzCoinService } from "src/app/byz-coin.service";

@Component({
    selector: "app-explorer",
    templateUrl: "./explorer.component.html",
})
export class ExplorerComponent implements OnInit {
    kind: string | undefined;
    credStruct: CredentialStructBS | undefined;
    coin: CoinInstance | undefined;
    darc: DarcInstance | undefined;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly bcs: ByzCoinService,
    ) {}

    async ngOnInit() {
        this.route.paramMap.subscribe(async (params) => {
            const id = Buffer.from(params.get("id"), "hex");

            const p = await this.bcs.bc.getProofFromLatest(id, undefined, undefined, false);
            switch (p.contractID) {

                case CredentialsInstance.contractID:
                    this.credStruct = await this.bcs.retrieveCredentialStructBS(id);
                    this.kind = "credential";
                    break;

                case CoinInstance.contractID:
                    this.coin = await CoinInstance.fromByzcoin(this.bcs.bc, id);
                    this.kind = "coin";
                    break;

                case DarcInstance.contractID:
                    this.darc = await DarcInstance.fromByzcoin(this.bcs.bc, id);
                    this.kind = "darc";
                    break;

                default:
                    this.kind = "unknown";
            }
        });
    }
}
