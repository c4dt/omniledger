import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Contact } from "@c4dt/dynacred";
import CoinInstance from "@dedis/cothority/byzcoin/contracts/coin-instance";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import Log from "@dedis/cothority/log";
import CredentialsInstance from "@dedis/cothority/personhood/credentials-instance";
import { UserData } from "src/app/user-data.service";

@Component({
    selector: "app-explorer",
    templateUrl: "./explorer.component.html",
})
export class ExplorerComponent implements OnInit {
    kind: string | undefined;
    contact: Contact | undefined;
    coin: CoinInstance | undefined;
    darc: DarcInstance | undefined;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly uData: UserData,
    ) {}

    async ngOnInit() {
        this.route.paramMap.subscribe(async (params) => {
            const id = Buffer.from(params.get("id"), "hex");

            const p = await this.uData.bc.getProofFromLatest(id);
            switch (p.contractID) {

                case CredentialsInstance.contractID:
                    this.contact = await Contact.fromByzcoin(this.uData.bc, id);
                    this.kind = "credential";
                    break;

                case CoinInstance.contractID:
                    this.coin = await CoinInstance.fromByzcoin(this.uData.bc, id);
                    this.kind = "coin";
                    break;

                case DarcInstance.contractID:
                    this.darc = await DarcInstance.fromByzcoin(this.uData.bc, id);
                    this.kind = "darc";
                    break;

                default:
                    this.kind = "unknown";
            }
        });
    }
}
