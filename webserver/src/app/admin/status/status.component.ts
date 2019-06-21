import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import Log from "@dedis/cothority/log";
import SkipchainRPC from "@dedis/cothority/skipchain/skipchain-rpc";
import StatusRPC from "@dedis/cothority/status/status-rpc";
import { Data, gData } from "@c4dt/dynacred/Data";
import { Defaults } from "@c4dt/dynacred/Defaults";
import { hexBuffer } from "../../../lib/Ui";

@Component({
  selector: "app-status",
  styleUrls: ["./status.component.css"],
  templateUrl: "./status.component.html",
})
export class StatusComponent implements OnInit {
  nodes = [];
  gData: Data;
  signID: string;
  userID: string;
  pubKey: string;

  constructor(private router: Router) {
    this.gData = gData;
    gData.contact.getDarcSignIdentity().then((dsi) => this.signID = hexBuffer(dsi.id));
    this.userID = hexBuffer(gData.contact.credentialIID);
    this.pubKey = hexBuffer(gData.keyIdentity._public.toBuffer());
  }

  async ngOnInit() {
    Log.lvl3("init status");
    await this.update();
  }

  async update() {
    this.nodes = [];
    const list = Defaults.Roster.list;
    const srpc = new StatusRPC(Defaults.Roster);
    for (let i = 0; i < list.length; i++) {
      let node = list[i].description;
      try {
        const s = await srpc.getStatus(i);
        node += ": OK - Port:" + JSON.stringify(s.status.Generic.field.Port);
      } catch (e) {
        node += ": Failed";
      }
      this.nodes.push(node);
    }
    this.nodes.sort();
  }

  async deleteUser() {
    gData.delete();
    await gData.save();
    await this.router.navigateByUrl(Defaults.PathNew);
  }
}
